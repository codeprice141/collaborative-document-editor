from fastapi import APIRouter
from app.api.v1.health import router as health_router

api_router = APIRouter()

# Register health check endpoint under /api/v1
api_router.include_router(health_router, tags=["health"])
