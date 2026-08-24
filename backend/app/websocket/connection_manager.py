import asyncio
import json
import logging
import uuid
from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket
from collections import defaultdict
from app.core.redis import get_redis_client

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Tracks connected WebSockets per document room with Redis Pub/Sub multi-pod horizontal scaling and message deduplication."""

    def __init__(self):
        # {doc_id: {client_id: WebSocket}}
        self._rooms: Dict[int, Dict[str, WebSocket]] = defaultdict(dict)
        # {WebSocket: (doc_id, client_id)}
        self._socket_lookup: Dict[WebSocket, tuple] = {}
        # {doc_id: asyncio.Task} for Redis listener tasks
        self._pubsub_tasks: Dict[int, asyncio.Task] = {}
        # Unique node ID for multi-pod mesh deduplication
        self._pod_id = uuid.uuid4().hex

    async def connect(self, doc_id: int, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self._rooms[doc_id][client_id] = websocket
        self._socket_lookup[websocket] = (doc_id, client_id)

        # Start Redis subscriber for multi-pod mesh if first connection in room
        if doc_id not in self._pubsub_tasks:
            self._pubsub_tasks[doc_id] = asyncio.create_task(self._listen_redis_channel(doc_id))

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
                # Cancel Redis subscriber when room is empty on this pod
                task = self._pubsub_tasks.pop(doc_id, None)
                if task:
                    task.cancel()
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
        publish_to_mesh: bool = True,
    ):
        """Broadcasts JSON message to all active sockets in room and publishes to Redis mesh."""
        # 1. Broadcast to sockets connected to this local pod
        await self._broadcast_local(doc_id, message, exclude_client_id)

        # 2. Redis Pub/Sub multi-pod mesh fanout
        if publish_to_mesh:
            try:
                redis = await get_redis_client()
                if redis:
                    payload = json.dumps({
                        "message": message,
                        "exclude_client_id": exclude_client_id,
                        "sender_pod_id": self._pod_id,
                    })
                    await redis.publish(f"room:{doc_id}", payload)
            except Exception as exc:
                logger.debug("Redis pub/sub publish skipped: %s", exc)

    async def _broadcast_local(self, doc_id: int, message: dict, exclude_client_id: Optional[str] = None):
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

    async def _listen_redis_channel(self, doc_id: int):
        """Background coroutine listening to Redis Pub/Sub for cross-pod real-time events."""
        try:
            redis = await get_redis_client()
            if not redis:
                return
            pubsub = redis.pubsub()
            await pubsub.subscribe(f"room:{doc_id}")
            async for raw_msg in pubsub.listen():
                if raw_msg and raw_msg.get("type") == "message":
                    try:
                        data = json.loads(raw_msg.get("data", "{}"))
                        # Deduplicate: ignore messages originating from this exact pod
                        if data.get("sender_pod_id") == self._pod_id:
                            continue
                        msg = data.get("message")
                        exclude_cid = data.get("exclude_client_id")
                        if msg:
                            await self._broadcast_local(doc_id, msg, exclude_client_id=exclude_cid)
                    except Exception as parse_err:
                        logger.debug("Error parsing cross-pod redis message: %s", parse_err)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.debug("Redis pub/sub listener exited: %s", exc)

    def get_room_clients_count(self, doc_id: int) -> int:
        return len(self._rooms.get(doc_id, {}))


manager = ConnectionManager()
