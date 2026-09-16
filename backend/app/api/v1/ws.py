import uuid
from typing import Optional
from fastapi import APIRouter, WebSocket, Query, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.websocket.handler import handle_websocket_connection, authenticate_ws_token
from app.websocket.connection_manager import manager
from fastapi import WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/notifications")
async def websocket_notifications_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Real-time user notification WebSocket endpoint (dashboard live alerts, invites, mentions)."""
    if not token:
        await websocket.close(code=4001)
        return

    user = authenticate_ws_token(token, db)
    if not user:
        await websocket.close(code=4001)
        return

    await manager.connect_user(user.id, websocket)
    try:
        while True:
            # Client heartbeat / ping keepalive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect_user(user.id, websocket)


@router.websocket("/documents/{doc_id}")
async def websocket_document_endpoint(
    websocket: WebSocket,
    doc_id: int,
    token: Optional[str] = Query(None),
    client_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Real-time collaborative WebSocket endpoint for documents."""
    assigned_client_id = client_id or str(uuid.uuid4())[:8]
    await handle_websocket_connection(
        websocket=websocket,
        document_id=doc_id,
        client_id=assigned_client_id,
        token=token,
        db=db,
    )
