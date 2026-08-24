import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import Base, engine
from app.core.redis import close_redis_client
from app.core.metrics import metrics
from app.services.write_behind_buffer import write_buffer
from app.api.v1.router import api_router
from app.api.v1.health import health_check
from app.models.comment import DocumentComment, DocumentCommentReply
from app.models.document import Document, DocumentCollaborator, DocumentSnapshot, DocumentOperation
from app.models.user import User

# Configure structured logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("collaborative_editor")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database table creation, auto-migrations, flusher loop, and graceful shutdown."""
    logger.info("Initializing database tables for %s...", settings.PROJECT_NAME)
    try:
        Base.metadata.create_all(bind=engine)
        # Non-destructive auto-migrations
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS drawing_data TEXT DEFAULT '[]'"))
            conn.execute(text("ALTER TABLE document_snapshots ADD COLUMN IF NOT EXISTS drawing_data TEXT DEFAULT '[]'"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS public_role VARCHAR(16) DEFAULT 'viewer'"))
            conn.commit()
    except Exception as exc:
        logger.warning("Auto-migration check on startup: %s", exc)

    # Start background Write-Behind flusher task
    flusher_task = asyncio.create_task(write_buffer.start_background_flusher())

    logger.info("Application %s started (version %s, env %s)", settings.PROJECT_NAME, settings.VERSION, settings.ENVIRONMENT)
    yield
    logger.info("Shutting down %s...", settings.PROJECT_NAME)

    # Cancel flusher and flush remaining dirty documents
    flusher_task.cancel()
    try:
        await flusher_task
    except asyncio.CancelledError:
        pass
    write_buffer.flush_all()

    await close_redis_client()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Top-level direct GET /health endpoint
app.add_api_route("/health", health_check, methods=["GET"], tags=["health"], summary="Root Health Check")

# Prometheus Metrics Scraping Endpoint
@app.get("/metrics", summary="Prometheus Metrics")
def prometheus_metrics():
    """Exposes production metrics in Prometheus standard text format."""
    return Response(content=metrics.generate_prometheus_text(), media_type="text/plain")


@app.get(f"{settings.API_V1_STR}/metrics", summary="JSON Metrics Summary")
def json_metrics_summary():
    """Returns JSON metrics summary for telemetry dashboards."""
    return metrics.get_summary()


# Include versioned API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Welcome")
def root():
    """Root endpoint providing service metadata and documentation links."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_url": "/health",
        "metrics_url": "/metrics",
    }
