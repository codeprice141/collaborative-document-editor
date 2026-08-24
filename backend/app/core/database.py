import time
import logging
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy Engine
# pool_pre_ping checks connection liveness before handing out connections
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Session factory for standard request-response lifecycles
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency to yield a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_health() -> Dict[str, Any]:
    """Executes a lightweight query to verify database connectivity and measure latency."""
    start_time = time.perf_counter()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "status": "connected",
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        return {
            "status": "disconnected",
            "error": str(exc),
        }
