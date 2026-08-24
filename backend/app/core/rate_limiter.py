import time
import threading
from typing import Dict, Tuple
from collections import defaultdict


class TokenBucketRateLimiter:
    """Token-bucket rate limiter per client/connection to protect against DDoS & spam."""

    def __init__(self, capacity: int = 60, refill_rate: float = 30.0):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second
        self._buckets: Dict[str, Tuple[float, float]] = {}  # {key: (tokens, last_time)}
        self._lock = threading.Lock()

    def allow(self, key: str, tokens: int = 1) -> bool:
        with self._lock:
            now = time.perf_counter()
            if key not in self._buckets:
                self._buckets[key] = (self.capacity - tokens, now)
                return True

            current_tokens, last_time = self._buckets[key]
            elapsed = now - last_time
            # Refill tokens based on elapsed time
            refilled_tokens = min(self.capacity, current_tokens + elapsed * self.refill_rate)

            if refilled_tokens >= tokens:
                self._buckets[key] = (refilled_tokens - tokens, now)
                return True
            else:
                self._buckets[key] = (refilled_tokens, now)
                return False


ws_rate_limiter = TokenBucketRateLimiter(capacity=100, refill_rate=50.0)
