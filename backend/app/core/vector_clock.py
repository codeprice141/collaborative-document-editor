from typing import Dict, Any


class VectorClock:
    """Vector Clock for tracking causal history across distributed collaborative nodes."""

    @staticmethod
    def create_empty() -> Dict[str, int]:
        return {}

    @staticmethod
    def increment(clock: Dict[str, int], client_id: str) -> Dict[str, int]:
        updated = dict(clock)
        updated[client_id] = updated.get(client_id, 0) + 1
        return updated

    @staticmethod
    def merge(clock_a: Dict[str, int], clock_b: Dict[str, int]) -> Dict[str, int]:
        merged = dict(clock_a)
        for client_id, count in clock_b.items():
            merged[client_id] = max(merged.get(client_id, 0), count)
        return merged

    @staticmethod
    def dominates(clock_a: Dict[str, int], clock_b: Dict[str, int]) -> bool:
        """Returns True if clock_a is strictly causally after or equal to clock_b."""
        has_strictly_greater = False
        for client_id, count_b in clock_b.items():
            count_a = clock_a.get(client_id, 0)
            if count_a < count_b:
                return False
            if count_a > count_b:
                has_strictly_greater = True
        return has_strictly_greater
