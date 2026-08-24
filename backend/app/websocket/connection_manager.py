import logging
from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket
from collections import defaultdict

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Tracks connected WebSockets per document room."""

    def __init__(self):
        # {doc_id: {client_id: WebSocket}}
        self._rooms: Dict[int, Dict[str, WebSocket]] = defaultdict(dict)
        # {WebSocket: (doc_id, client_id)}
        self._socket_lookup: Dict[WebSocket, tuple] = {}

    async def connect(self, doc_id: int, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self._rooms[doc_id][client_id] = websocket
        self._socket_lookup[websocket] = (doc_id, client_id)
        logger.info(
            "WebSocket connected [doc_id=%s, client_id=%s, total_in_room=%d]",
            doc_id, client_id, len(self._rooms[doc_id])
        )

    def disconnect(self, websocket: WebSocket) -> Optional[tuple]:
        info = self._socket_lookup.pop(websocket, None)
        if info:
            doc_id, client_id = info
            self._rooms[doc_id].pop(client_id, None)
            if not self._rooms[doc_id]:
                self._rooms.pop(doc_id, None)
            logger.info("WebSocket disconnected [doc_id=%s, client_id=%s]", doc_id, client_id)
            return doc_id, client_id
        return None

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as exc:
            logger.warning("Failed to send personal message: %s", exc)

    async def broadcast_to_room(
        self,
        doc_id: int,
        message: dict,
        exclude_client_id: Optional[str] = None,
    ):
        """Broadcasts JSON message to all active sockets in room."""
        if doc_id not in self._rooms:
            return

        dead_sockets = []
        for client_id, ws in list(self._rooms[doc_id].items()):
            if exclude_client_id and client_id == exclude_client_id:
                continue
            try:
                await ws.send_json(message)
            except Exception as exc:
                logger.warning("Error broadcasting to client %s: %s", client_id, exc)
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect(ws)

    def get_room_clients_count(self, doc_id: int) -> int:
        return len(self._rooms.get(doc_id, {}))


manager = ConnectionManager()
