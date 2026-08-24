import asyncio
import logging
import threading
from typing import Dict, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.document import Document

logger = logging.getLogger(__name__)


class WriteBehindBuffer:
    """Asynchronously batches and flushes document operations to PostgreSQL without blocking WebSocket latency."""

    def __init__(self, flush_interval_seconds: float = 2.0):
        self.flush_interval = flush_interval_seconds
        # {doc_id: (latest_content, latest_version, timestamp)}
        self._dirty_documents: Dict[int, tuple] = {}
        self._lock = threading.Lock()
        self._is_running = False
        self._flush_task: asyncio.Task = None

    def mark_dirty(self, doc_id: int, content: str, version: int):
        with self._lock:
            self._dirty_documents[doc_id] = (content, version, datetime.now(timezone.utc))

    def flush_all(self):
        """Flushes all dirty documents to PostgreSQL synchronously."""
        with self._lock:
            if not self._dirty_documents:
                return
            to_flush = dict(self._dirty_documents)
            self._dirty_documents.clear()

        db: Session = SessionLocal()
        try:
            for doc_id, (content, version, updated_at) in to_flush.items():
                doc = db.query(Document).filter(Document.id == doc_id).first()
                if doc:
                    doc.content = content
                    doc.version = version
                    doc.updated_at = updated_at
            db.commit()
            logger.info("WriteBehindBuffer: Flushed %d dirty documents to database.", len(to_flush))
        except Exception as exc:
            db.rollback()
            logger.error("WriteBehindBuffer flush failed: %s", exc)
        finally:
            db.close()

    async def start_background_flusher(self):
        """Continuous background loop to flush dirty documents every interval."""
        self._is_running = True
        logger.info("WriteBehindBuffer background flusher started.")
        try:
            while self._is_running:
                await asyncio.sleep(self.flush_interval)
                self.flush_all()
        except asyncio.CancelledError:
            self.flush_all()
            logger.info("WriteBehindBuffer background flusher stopped.")


write_buffer = WriteBehindBuffer(flush_interval_seconds=2.0)
