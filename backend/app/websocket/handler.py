import json
import logging
import time
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.metrics import metrics
from app.core.rate_limiter import ws_rate_limiter
from app.core.security import decode_access_token
from app.models.user import User
from app.models.document import CollaboratorRole
from app.services.document_service import DocumentService
from app.services.auth_service import AuthService
from app.services.presence_service import presence_service
from app.services.sync_engine import sync_engine
from app.services.write_behind_buffer import write_buffer
from app.websocket.connection_manager import manager

logger = logging.getLogger(__name__)


def authenticate_ws_token(token: str, db: Session) -> Optional[User]:
    """Decodes JWT token and validates active user for WebSocket handshake."""
    try:
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user if user and user.is_active else None
    except Exception as exc:
        logger.warning("WebSocket token verification failed: %s", exc)
        return None


async def handle_websocket_connection(
    websocket: WebSocket,
    document_id: int,
    client_id: str,
    token: Optional[str] = None,
    db: Optional[Session] = None,
):
    user: Optional[User] = None

    try:
        # 1. Authenticate token
        if token and db is not None:
            user = authenticate_ws_token(token, db)

        if not user:
            await websocket.accept()
            await websocket.send_json({"type": "error", "message": "Authentication failed: invalid or missing token"})
            await websocket.close(code=4001)
            return

        # 2. Check document permissions
        doc, role = DocumentService.get_document_with_access(db, document_id, user.id)
        if not doc or not role:
            await websocket.accept()
            await websocket.send_json({"type": "error", "message": "Document not found or permission denied"})
            await websocket.close(code=4003)
            return

        role_str = role.value if hasattr(role, "value") else str(role)
        role_enum = CollaboratorRole(role_str)

        # 3. Accept connection and record telemetry
        await manager.connect(document_id, client_id, websocket)
        metrics.ws_connected()

        # 4. Register presence
        user_presence = presence_service.user_joined(
            doc_id=document_id,
            client_id=client_id,
            user_id=user.id,
            name=user.full_name,
            email=user.email,
        )

        # 5. Send initial synchronization payload (sync_init) including persistent drawing_data
        init_payload = {
            "type": "sync_init",
            "document_id": doc.id,
            "title": doc.title,
            "content": doc.content,
            "drawing_data": doc.drawing_data or "[]",
            "version": doc.version,
            "user_role": role_str,
            "user_color": user_presence.color,
            "vector_clock": sync_engine.get_vector_clock(document_id),
            "active_users": presence_service.get_room_presence(document_id),
        }
        await manager.send_personal_message(init_payload, websocket)

        # 6. Broadcast user joined to room
        await manager.broadcast_to_room(
            document_id,
            {
                "type": "presence_join",
                "user": user_presence.model_dump(),
                "active_users": presence_service.get_room_presence(document_id),
            },
            exclude_client_id=client_id,
        )

        # 7. Main high-throughput event loop
        while True:
            raw_data = await websocket.receive_text()
            op_start_time = time.perf_counter()

            # Apply token bucket rate limiting
            if not ws_rate_limiter.allow(client_id):
                metrics.record_rate_limited()
                await manager.send_personal_message(
                    {"type": "error", "message": "Rate limit exceeded. Please slow down."}, websocket
                )
                continue

            try:
                msg = json.loads(raw_data)
            except json.JSONDecodeError:
                await manager.send_personal_message({"type": "error", "message": "Invalid JSON"}, websocket)
                continue

            msg_type = msg.get("type")

            # --- Heartbeat Ping / Pong ---
            if msg_type == "ping":
                presence_service.touch(document_id, client_id)
                await manager.send_personal_message({"type": "pong"}, websocket)

            # --- Collaborative Edit Operation (OT & Vector Clocks) ---
            elif msg_type == "operation":
                if role_enum == CollaboratorRole.VIEWER:
                    await manager.send_personal_message(
                        {"type": "error", "message": "Viewers cannot edit document"}, websocket
                    )
                    continue

                op_data = msg.get("operation", {})
                op_data["client_id"] = client_id

                # Apply OT on sync engine in memory
                new_content, new_version, transformed_op = sync_engine.process_operation(
                    doc_id=document_id,
                    incoming_op=op_data,
                    current_content=doc.content,
                    current_server_version=doc.version,
                )

                # Update in-memory document state
                doc.content = new_content
                doc.version = new_version

                # Buffer write-behind asynchronously to PostgreSQL
                write_buffer.mark_dirty(document_id, content=new_content, version=new_version)

                # Broadcast transformed operation to all room peers
                broadcast_msg = {
                    "type": "operation_broadcast",
                    "operation": transformed_op,
                    "version": new_version,
                    "client_id": client_id,
                }
                await manager.broadcast_to_room(document_id, broadcast_msg, exclude_client_id=client_id)

                # Send ACK to sender
                await manager.send_personal_message(
                    {
                        "type": "operation_ack",
                        "client_version": op_data.get("client_version"),
                        "server_version": new_version,
                        "lamport_ts": transformed_op.get("lamport_ts"),
                    },
                    websocket,
                )

                # Record latency metric
                latency_ms = (time.perf_counter() - op_start_time) * 1000
                metrics.record_operation(latency_ms)

            # --- Yjs Real-Time CRDT Sync ---
            elif msg_type == "yjs_update":
                if role_enum == CollaboratorRole.VIEWER:
                    await manager.send_personal_message(
                        {"type": "error", "message": "Viewers cannot edit document"}, websocket
                    )
                    continue

                update_b64 = msg.get("update")
                html_preview = msg.get("html")
                if html_preview is not None:
                    doc.content = html_preview
                    write_buffer.mark_dirty(document_id, content=html_preview)

                if update_b64:
                    await manager.broadcast_to_room(
                        document_id,
                        {
                            "type": "yjs_broadcast",
                            "update": update_b64,
                            "client_id": client_id,
                            "user_id": user.id,
                        },
                        exclude_client_id=client_id,
                    )

            # --- Whiteboard Live Drawing & Vector Shapes (with persistence!) ---
            elif msg_type == "draw":
                if role_enum == CollaboratorRole.VIEWER:
                    await manager.send_personal_message(
                        {"type": "error", "message": "Viewers cannot draw on document"}, websocket
                    )
                    continue

                elements_data = msg.get("elements")
                stroke_data = msg.get("stroke")

                if elements_data is not None:
                    drawing_json = json.dumps(elements_data) if not isinstance(elements_data, str) else elements_data
                    doc.drawing_data = drawing_json
                    write_buffer.mark_dirty(document_id, drawing_data=drawing_json)

                await manager.broadcast_to_room(
                    document_id,
                    {
                        "type": "draw_broadcast",
                        "elements": elements_data,
                        "stroke": stroke_data,
                        "client_id": client_id,
                        "user_id": user.id,
                        "user_name": user.full_name,
                        "user_color": user_presence.color,
                    },
                    exclude_client_id=client_id,
                )

            # --- Live Cursors & Selection Presence ---
            elif msg_type == "cursor":
                cursor_pos = msg.get("cursor")
                selection_range = msg.get("selection")
                is_typing = bool(msg.get("is_typing", False))

                updated_presence = presence_service.update_cursor(
                    doc_id=document_id,
                    client_id=client_id,
                    cursor=cursor_pos,
                    selection=selection_range,
                    is_typing=is_typing,
                )
                if updated_presence:
                    await manager.broadcast_to_room(
                        document_id,
                        {
                            "type": "cursor_update",
                            "client_id": client_id,
                            "user_id": user.id,
                            "cursor": cursor_pos,
                            "selection": selection_range,
                            "is_typing": is_typing,
                        },
                        exclude_client_id=client_id,
                    )

            # --- Real-Time Comment & Mention Events ---
            elif msg_type == "comment_event":
                await manager.broadcast_to_room(
                    document_id,
                    {
                        "type": "comment_broadcast",
                        "action": msg.get("action", "created"),
                        "comment": msg.get("comment"),
                        "sender_name": user.full_name,
                        "sender_id": user.id,
                        "mentioned_emails": msg.get("mentioned_emails", []),
                        "mentioned_names": msg.get("mentioned_names", []),
                    },
                    exclude_client_id=client_id,
                )

            # --- Reconnect Recovery Request ---
            elif msg_type == "sync_request":
                from_ver = int(msg.get("from_version", 0))
                missed_ops = sync_engine.get_operations_since(document_id, from_ver)
                await manager.send_personal_message(
                    {
                        "type": "sync_recovery",
                        "current_version": doc.version,
                        "current_content": doc.content,
                        "drawing_data": doc.drawing_data or "[]",
                        "missed_operations": missed_ops,
                        "vector_clock": sync_engine.get_vector_clock(document_id),
                    },
                    websocket,
                )

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.error("WebSocket unhandled exception: %s", exc)
    finally:
        manager.disconnect(websocket)
        metrics.ws_disconnected()
        presence_service.user_left(document_id, client_id)
        if user:
            try:
                await manager.broadcast_to_room(
                    document_id,
                    {
                        "type": "presence_leave",
                        "client_id": client_id,
                        "user_id": user.id,
                        "active_users": presence_service.get_room_presence(document_id),
                    },
                )
            except Exception as b_err:
                logger.debug("Failed to broadcast presence_leave: %s", b_err)
