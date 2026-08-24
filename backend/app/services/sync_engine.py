import threading
from typing import Dict, List, Tuple, Optional
from collections import defaultdict


class SyncEngine:
    """Operational Transformation (OT) engine for real-time text synchronization."""

    def __init__(self):
        # In-memory history buffer per document: {doc_id: List[op_dict]}
        self._history: Dict[int, List[dict]] = defaultdict(list)
        # Lock per document for atomic server operation application
        self._locks: Dict[int, threading.Lock] = defaultdict(threading.Lock)

    def get_lock(self, doc_id: int) -> threading.Lock:
        return self._locks[doc_id]

    @staticmethod
    def apply_operation(content: str, op: dict) -> str:
        """Applies an operation to a text string."""
        op_type = op.get("op_type")
        pos = int(op.get("position", 0))

        # Clamp position to valid range
        pos = max(0, min(pos, len(content)))

        if op_type == "insert":
            text_to_insert = op.get("text", "")
            return content[:pos] + text_to_insert + content[pos:]

        elif op_type == "delete":
            length = int(op.get("length", 0))
            if length <= 0:
                return content
            end_pos = min(pos + length, len(content))
            return content[:pos] + content[end_pos:]

        elif op_type == "replace":
            new_text = op.get("text", "")
            return new_text

        return content

    @classmethod
    def transform_op(cls, incoming: dict, historic: dict) -> dict:
        """Transforms incoming operation against a concurrently applied historic operation (OT)."""
        res = dict(incoming)
        in_type = incoming.get("op_type")
        in_pos = int(incoming.get("position", 0))
        hist_type = historic.get("op_type")
        hist_pos = int(historic.get("position", 0))

        if in_type == "replace" or hist_type == "replace":
            return res

        if hist_type == "insert":
            hist_len = len(historic.get("text", ""))
            if hist_pos < in_pos:
                res["position"] = in_pos + hist_len
            elif hist_pos == in_pos:
                # Deterministic tie-breaking: higher client_id shifts after lower client_id
                if incoming.get("client_id", "") > historic.get("client_id", ""):
                    res["position"] = in_pos + hist_len

        elif hist_type == "delete":
            hist_len = int(historic.get("length", 0))
            hist_end = hist_pos + hist_len

            if in_type == "insert":
                if in_pos <= hist_pos:
                    pass
                elif in_pos >= hist_end:
                    res["position"] = in_pos - hist_len
                else:
                    res["position"] = hist_pos

            elif in_type == "delete":
                in_len = int(incoming.get("length", 0))
                in_end = in_pos + in_len

                if in_end <= hist_pos:
                    pass
                elif in_pos >= hist_end:
                    res["position"] = in_pos - hist_len
                else:
                    new_start = min(in_pos, hist_pos)
                    if in_pos < hist_pos:
                        overlap = in_end - hist_pos
                        res["position"] = in_pos
                        res["length"] = max(0, in_len - min(overlap, hist_len))
                    else:
                        res["position"] = hist_pos
                        overlap = hist_end - in_pos
                        res["length"] = max(0, in_len - overlap)

        return res

    def process_operation(
        self,
        doc_id: int,
        incoming_op: dict,
        current_content: str,
        current_server_version: int,
    ) -> Tuple[str, int, dict]:
        """Atomically transforms incoming operation against missing versions and updates content."""
        with self.get_lock(doc_id):
            client_ver = int(incoming_op.get("client_version", 0))
            history = self._history[doc_id]

            concurrent_ops = [
                op for op in history if op.get("server_version", 0) > client_ver
            ]

            transformed = dict(incoming_op)
            for c_op in concurrent_ops:
                transformed = self.transform_op(transformed, c_op)

            new_content = self.apply_operation(current_content, transformed)
            new_version = current_server_version + 1

            transformed["server_version"] = new_version
            transformed["doc_id"] = doc_id

            history.append(transformed)
            if len(history) > 1000:
                self._history[doc_id] = history[-1000:]

            return new_content, new_version, transformed

    def get_operations_since(self, doc_id: int, from_version: int) -> List[dict]:
        """Returns missed operations for reconnect / recovery."""
        with self.get_lock(doc_id):
            history = self._history[doc_id]
            return [op for op in history if op.get("server_version", 0) > from_version]


sync_engine = SyncEngine()
