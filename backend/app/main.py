import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.api.v1.health import health_check

# Configure structured logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("collaborative_editor")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for application startup and shutdown events."""
    logger.info("Starting up %s (version %s, env %s)", settings.PROJECT_NAME, settings.VERSION, settings.ENVIRONMENT)
    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Set up CORS middleware
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Top-level direct GET /health endpoint for container probes / load balancers
app.add_api_route("/health", health_check, methods=["GET"], tags=["health"], summary="Root Health Check")

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
    }
