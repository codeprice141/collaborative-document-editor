import time
import threading
from collections import defaultdict
from typing import Dict, Any


class MetricsCollector:
    """Production Prometheus-compatible metrics tracker."""

    def __init__(self):
        self._lock = threading.Lock()
        self.active_websockets: int = 0
        self.total_operations_processed: int = 0
        self.total_ws_connects: int = 0
        self.total_ws_disconnects: int = 0
        self.total_rate_limited_ops: int = 0
        self.operation_latencies: list = []  # last 1000 latencies in ms

    def ws_connected(self):
        with self._lock:
            self.active_websockets += 1
            self.total_ws_connects += 1

    def ws_disconnected(self):
        with self._lock:
            self.active_websockets = max(0, self.active_websockets - 1)
            self.total_ws_disconnects += 1

    def record_operation(self, latency_ms: float):
        with self._lock:
            self.total_operations_processed += 1
            self.operation_latencies.append(latency_ms)
            if len(self.operation_latencies) > 1000:
                self.operation_latencies = self.operation_latencies[-1000:]

    def record_rate_limited(self):
        with self._lock:
            self.total_rate_limited_ops += 1

    def get_summary(self) -> Dict[str, Any]:
        with self._lock:
            lats = sorted(self.operation_latencies) if self.operation_latencies else [0.0]
            p50 = lats[int(len(lats) * 0.5)]
            p95 = lats[int(len(lats) * 0.95)] if len(lats) > 1 else lats[0]
            p99 = lats[int(len(lats) * 0.99)] if len(lats) > 1 else lats[0]

            return {
                "active_websockets": self.active_websockets,
                "total_operations_processed": self.total_operations_processed,
                "total_connections": self.total_ws_connects,
                "total_disconnections": self.total_ws_disconnects,
                "rate_limited_operations": self.total_rate_limited_ops,
                "latency_p50_ms": round(p50, 2),
                "latency_p95_ms": round(p95, 2),
                "latency_p99_ms": round(p99, 2),
            }

    def generate_prometheus_text(self) -> str:
        s = self.get_summary()
        lines = [
            "# HELP collab_active_websockets Current active WebSocket connections",
            "# TYPE collab_active_websockets gauge",
            f"collab_active_websockets {s['active_websockets']}",
            "",
            "# HELP collab_operations_total Total operations processed",
            "# TYPE collab_operations_total counter",
            f"collab_operations_total {s['total_operations_processed']}",
            "",
            "# HELP collab_rate_limited_total Total rate limited operations",
            "# TYPE collab_rate_limited_total counter",
            f"collab_rate_limited_total {s['rate_limited_operations']}",
            "",
            "# HELP collab_operation_latency_p95_ms P95 operation processing latency",
            "# TYPE collab_operation_latency_p95_ms gauge",
            f"collab_operation_latency_p95_ms {s['latency_p95_ms']}",
            "",
            "# HELP collab_operation_latency_p99_ms P99 operation processing latency",
            "# TYPE collab_operation_latency_p99_ms gauge",
            f"collab_operation_latency_p99_ms {s['latency_p99_ms']}",
        ]
        return "\n".join(lines) + "\n"


metrics = MetricsCollector()
