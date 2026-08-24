import asyncio
import json
import logging
from typing import Optional, Callable
from app.core.config import settings
from app.core.redis import get_redis_client

logger = logging.getLogger(__name__)


class RedisPubSubManager:
    """Handles cross-instance message publishing and subscription over Redis."""

    def __init__(self):
        self._pubsub_task: Optional[asyncio.Task] = None
        self._subscribed_channels: set = set()

    async def publish(self, channel: str, message: dict):
        redis = await get_redis_client()
        if redis:
            try:
                payload = json.dumps(message)
                await redis.publish(channel, payload)
            except Exception as exc:
                logger.warning("Redis publish failed on channel %s: %s", channel, exc)

    async def start_listener(self, broadcast_callback: Callable):
        """Background loop to listen for published messages across instances."""
        if not settings.USE_REDIS_PUBSUB:
            return

        redis = await get_redis_client()
        if not redis:
            return

        try:
            pubsub = redis.pubsub()
            await pubsub.psubscribe("doc_room:*")
            logger.info("Subscribed to Redis pattern doc_room:*")

            async for msg in pubsub.listen():
                if msg["type"] == "pmessage":
                    try:
                        channel = msg["channel"]
                        doc_id = int(channel.split(":")[1])
                        data = json.loads(msg["data"])
                        await broadcast_callback(doc_id, data)
                    except Exception as e:
                        logger.error("Error processing Redis message: %s", e)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("Redis listener crashed: %s", exc)


pubsub_manager = RedisPubSubManager()
