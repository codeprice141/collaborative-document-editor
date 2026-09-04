import time
import threading
from typing import Dict, List, Optional
from collections import defaultdict
from app.schemas.presence import UserPresence, CursorPosition, SelectionRange

# Distinct colors assigned to collaborators
COLLAB_COLORS = [
    "#6366f1", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
    "#3b82f6", "#84cc16", "#06b6d4", "#e11d48"
]


class PresenceService:
    """Manages live presence state per document room with deduplication and heartbeat tracking."""

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

    def touch(self, doc_id: int, client_id: str):
        """Refreshes last_seen timestamp on heartbeat ping or client activity."""
        with self._lock:
            presence = self._rooms[doc_id].get(client_id)
            if presence:
                presence.last_seen = time.time()

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
        """Returns unique active users and cleans up connections inactive for > 45s."""
        with self._lock:
            now = time.time()
            stale_keys = []
            # Deduplicate by user_id to ensure multiple tabs or reconnects count as 1 collaborator
            users_by_id: Dict[int, UserPresence] = {}
            anon_users: List[UserPresence] = []

            for cid, pres in self._rooms[doc_id].items():
                if now - pres.last_seen > 45:
                    stale_keys.append(cid)
                else:
                    if pres.user_id:
                        existing = users_by_id.get(pres.user_id)
                        if not existing or pres.last_seen > existing.last_seen:
                            users_by_id[pres.user_id] = pres
                    else:
                        anon_users.append(pres)

            for k in stale_keys:
                self._rooms[doc_id].pop(k, None)

            active = [p.model_dump() for p in users_by_id.values()] + [p.model_dump() for p in anon_users]
            return active


presence_service = PresenceService()
