import asyncio
import logging
import threading
from typing import Dict, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.document import Document

logger = logging.getLogger(__name__)


class WriteBehindBuffer:
    """Asynchronously batches and flushes document operations & whiteboard drawing state to PostgreSQL."""

    def __init__(self, flush_interval_seconds: float = 2.0):
        self.flush_interval = flush_interval_seconds
        # {doc_id: (latest_content, latest_version, timestamp, drawing_data)}
        self._dirty_documents: Dict[int, tuple] = {}
        self._lock = threading.Lock()
        self._is_running = False

    def mark_dirty(self, doc_id: int, content: Optional[str] = None, version: int = 0, drawing_data: Optional[str] = None):
        with self._lock:
            existing = self._dirty_documents.get(doc_id, (None, version, datetime.now(timezone.utc), None))
            new_content = content if content is not None else existing[0]
            new_drawing = drawing_data if drawing_data is not None else existing[3]
            self._dirty_documents[doc_id] = (new_content, version, datetime.now(timezone.utc), new_drawing)

    def flush_all(self):
        """Flushes all dirty documents to PostgreSQL synchronously."""
        with self._lock:
            if not self._dirty_documents:
                return
            to_flush = dict(self._dirty_documents)
            self._dirty_documents.clear()

        db: Session = SessionLocal()
        try:
            for doc_id, (content, version, updated_at, drawing_data) in to_flush.items():
                doc = db.query(Document).filter(Document.id == doc_id).first()
                if doc:
                    if content is not None:
                        doc.content = content
                    if version > 0:
                        doc.version = version
                    if drawing_data is not None:
                        doc.drawing_data = drawing_data
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
