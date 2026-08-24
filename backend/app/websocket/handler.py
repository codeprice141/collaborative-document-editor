import json
import logging
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.models.user import User
from app.models.document import Document, CollaboratorRole
from app.services.document_service import DocumentService
from app.services.sync_engine import sync_engine
from app.services.presence_service import presence_service
from app.websocket.connection_manager import manager

logger = logging.getLogger(__name__)


def authenticate_ws_token(token: str, db: Session) -> Optional[User]:
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == int(user_id)).first()


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
        if not doc:
            await websocket.accept()
            await websocket.send_json({"type": "error", "message": "Document not found or permission denied"})
            await websocket.close(code=4003)
            return

        # 3. Accept and register connection
        await manager.connect(document_id, client_id, websocket)

        # 4. Register presence
        user_presence = presence_service.user_joined(
            doc_id=document_id,
            client_id=client_id,
            user_id=user.id,
            name=user.full_name,
            email=user.email,
        )

        # 5. Send initial synchronization payload (sync_init)
        init_payload = {
            "type": "sync_init",
            "document_id": doc.id,
            "title": doc.title,
            "content": doc.content,
            "version": doc.version,
            "user_role": role.value,
            "user_color": user_presence.color,
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

        # 7. Main message loop
        while True:
            raw_data = await websocket.receive_text()
            try:
                msg = json.loads(raw_data)
            except json.JSONDecodeError:
                await manager.send_personal_message({"type": "error", "message": "Invalid JSON"}, websocket)
                continue

            msg_type = msg.get("type")

            # --- Ping / Pong ---
            if msg_type == "ping":
                await manager.send_personal_message({"type": "pong"}, websocket)

            # --- Edit Operation (OT Synchronization) ---
            elif msg_type == "operation":
                if role == CollaboratorRole.VIEWER:
                    await manager.send_personal_message(
                        {"type": "error", "message": "Viewers cannot edit document"}, websocket
                    )
                    continue

                op_data = msg.get("operation", {})
                op_data["client_id"] = client_id

                # Apply OT on sync engine
                new_content, new_version, transformed_op = sync_engine.process_operation(
                    doc_id=document_id,
                    incoming_op=op_data,
                    current_content=doc.content,
                    current_server_version=doc.version,
                )

                # Update in DB
                doc.content = new_content
                doc.version = new_version
                db.commit()

                # Broadcast operation to all collaborators in room
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
                    },
                    websocket,
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

            # --- Reconnect Recovery Request ---
            elif msg_type == "sync_request":
                from_ver = int(msg.get("from_version", 0))
                missed_ops = sync_engine.get_operations_since(document_id, from_ver)
                await manager.send_personal_message(
                    {
                        "type": "sync_recovery",
                        "current_version": doc.version,
                        "current_content": doc.content,
                        "missed_operations": missed_ops,
                    },
                    websocket,
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        presence_service.user_left(document_id, client_id)
        if user:
            await manager.broadcast_to_room(
                document_id,
                {
                    "type": "presence_leave",
                    "client_id": client_id,
                    "user_id": user.id,
                    "active_users": presence_service.get_room_presence(document_id),
                },
            )
    except Exception as exc:
        logger.error("WebSocket unhandled exception: %s", exc)
        manager.disconnect(websocket)
        presence_service.user_left(document_id, client_id)
