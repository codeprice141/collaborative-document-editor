import logging
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> Optional[aioredis.Redis]:
    """Returns an async Redis client or None if Redis is unreachable."""
    global redis_client
    if not settings.USE_REDIS_PUBSUB:
        return None

    if redis_client is None:
        try:
            client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0,
            )
            await client.ping()
            redis_client = client
            logger.info("Connected to Redis at %s", settings.REDIS_URL)
        except Exception as exc:
            logger.warning("Redis is not available (%s). Using in-memory fallback.", exc)
            redis_client = None

    return redis_client


async def close_redis_client():
    """Closes the Redis connection pool on shutdown."""
    global redis_client
    if redis_client is not None:
        try:
            await redis_client.close()
            logger.info("Redis connection closed.")
        except Exception:
            pass
        redis_client = None
