import uuid
from typing import Optional
from fastapi import APIRouter, WebSocket, Query, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.websocket.handler import handle_websocket_connection

router = APIRouter(prefix="/ws", tags=["websocket"])


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
