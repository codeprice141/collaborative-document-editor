import pytest
import time
from app.core.vector_clock import VectorClock
from app.core.rate_limiter import TokenBucketRateLimiter
from app.core.metrics import MetricsCollector
from app.services.write_behind_buffer import WriteBehindBuffer


def test_vector_clock_operations():
    vc = VectorClock.create_empty()
    assert vc == {}

    vc1 = VectorClock.increment(vc, "client_a")
    assert vc1 == {"client_a": 1}

    vc2 = VectorClock.increment(vc1, "client_a")
    vc3 = VectorClock.increment(vc2, "client_b")
    assert vc3 == {"client_a": 2, "client_b": 1}

    # Test merge
    vc_other = {"client_a": 1, "client_b": 3, "client_c": 1}
    merged = VectorClock.merge(vc3, vc_other)
    assert merged == {"client_a": 2, "client_b": 3, "client_c": 1}


def test_token_bucket_rate_limiter():
    limiter = TokenBucketRateLimiter(capacity=5, refill_rate=10.0)

    # First 5 calls allowed
    for _ in range(5):
        assert limiter.allow("user_test") is True

    # 6th call exceeds capacity
    assert limiter.allow("user_test") is False

    # Wait for token refill
    time.sleep(0.2)
    assert limiter.allow("user_test") is True


def test_metrics_collector():
    collector = MetricsCollector()
    collector.ws_connected()
    collector.ws_connected()
    collector.ws_disconnected()

    for lat in [5.0, 10.0, 15.0, 20.0, 50.0]:
        collector.record_operation(lat)

    collector.record_rate_limited()

    summary = collector.get_summary()
    assert summary["active_websockets"] == 1
    assert summary["total_connections"] == 2
    assert summary["total_disconnections"] == 1
    assert summary["total_operations_processed"] == 5
    assert summary["rate_limited_operations"] == 1
    assert summary["latency_p50_ms"] > 0

    prom_text = collector.generate_prometheus_text()
    assert "collab_active_websockets 1" in prom_text
    assert "collab_operations_total 5" in prom_text


def test_metrics_endpoint(client):
    res = client.get("/metrics")
    assert res.status_code == 200
    assert "collab_active_websockets" in res.text

    res_json = client.get("/api/v1/metrics")
    assert res_json.status_code == 200
    assert "active_websockets" in res_json.json()
