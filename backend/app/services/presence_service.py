import time
import threading
from typing import Dict, List, Optional
from collections import defaultdict
from app.schemas.presence import UserPresence, CursorPosition, SelectionRange

# Distinct colors assigned to collaborators
COLLAB_COLORS = [
    "#FF5722", "#4CAF50", "#2196F3", "#9C27B0",
    "#E91E63", "#00BCD4", "#FF9800", "#3F51B5",
    "#009688", "#795548", "#607D8B", "#FFC107"
]


class PresenceService:
    """Manages live presence state per document room."""

    def __init__(self):
        # {doc_id: {client_id: UserPresence}}
        self._rooms: Dict[int, Dict[str, UserPresence]] = defaultdict(dict)
        self._lock = threading.Lock()

    @staticmethod
    def get_user_color(user_id: int) -> str:
        return COLLAB_COLORS[user_id % len(COLLAB_COLORS)]

    def user_joined(
        self,
        doc_id: int,
        client_id: str,
        user_id: int,
        name: str,
        email: str,
    ) -> UserPresence:
        with self._lock:
            color = self.get_user_color(user_id)
            presence = UserPresence(
                user_id=user_id,
                client_id=client_id,
                name=name,
                email=email,
                color=color,
                last_seen=time.time(),
            )
            self._rooms[doc_id][client_id] = presence
            return presence

    def user_left(self, doc_id: int, client_id: str) -> Optional[UserPresence]:
        with self._lock:
            return self._rooms[doc_id].pop(client_id, None)

    def update_cursor(
        self,
        doc_id: int,
        client_id: str,
        cursor: Optional[CursorPosition],
        selection: Optional[SelectionRange],
        is_typing: bool = False,
    ) -> Optional[UserPresence]:
        with self._lock:
            presence = self._rooms[doc_id].get(client_id)
            if presence:
                presence.cursor = cursor
                presence.selection = selection
                presence.is_typing = is_typing
                presence.last_seen = time.time()
                return presence
            return None

    def get_room_presence(self, doc_id: int) -> List[dict]:
        """Returns active users and cleans up stale connections (> 60s inactivity)."""
        with self._lock:
            now = time.time()
            active = []
            stale_keys = []
            for cid, pres in self._rooms[doc_id].items():
                if now - pres.last_seen > 60:
                    stale_keys.append(cid)
                else:
                    active.append(pres.model_dump())

            for k in stale_keys:
                self._rooms[doc_id].pop(k, None)

            return active


presence_service = PresenceService()
