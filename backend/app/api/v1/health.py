from fastapi import APIRouter
from app.core.config import settings
from app.core.database import check_database_health

router = APIRouter()


@router.get("/health", summary="Service Health Check")
def health_check():
    """Performs a service health check including database connectivity."""
    db_health = check_database_health()
    
    is_healthy = db_health.get("status") == "connected"
    
    return {
        "status": "ok" if is_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_health,
    }
