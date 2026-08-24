from app.services.sync_engine import SyncEngine


def test_basic_insert_and_delete():
    engine = SyncEngine()
    initial = "Hello World"

    # Insert " Beautiful" at index 5
    op1 = {"op_type": "insert", "position": 5, "text": " Beautiful"}
    res1 = engine.apply_operation(initial, op1)
    assert res1 == "Hello Beautiful World"

    # Delete " Beautiful" (length 10) starting at index 5
    op2 = {"op_type": "delete", "position": 5, "length": 10}
    res2 = engine.apply_operation(res1, op2)
    assert res2 == "Hello World"


def test_concurrent_inserts_ot_transformation():
    # Client A inserts "A " at 0. Client B inserts "B " at 0 concurrently.
    engine = SyncEngine()
    doc = "Hello"

    op_a = {"op_type": "insert", "position": 0, "text": "A ", "client_id": "client_1", "client_version": 0}
    op_b = {"op_type": "insert", "position": 0, "text": "B ", "client_id": "client_2", "client_version": 0}

    # Transform op_b against op_a
    transformed_b = engine.transform_op(op_b, op_a)
    assert transformed_b["position"] == 2  # shifted by len("A ")

    # Apply in sequence
    step1 = engine.apply_operation(doc, op_a)
    assert step1 == "A Hello"
    final_text = engine.apply_operation(step1, transformed_b)
    assert final_text == "A B Hello"


def test_concurrent_delete_and_insert_convergence():
    # Client A deletes "World" at index 6. Client B inserts "Great " at index 6.
    engine = SyncEngine()
    doc = "Hello World"

    op_delete = {"op_type": "delete", "position": 6, "length": 5, "client_id": "c1", "client_version": 0}
    op_insert = {"op_type": "insert", "position": 6, "text": "Great ", "client_id": "c2", "client_version": 0}

    # Transform insert against delete
    transformed_insert = engine.transform_op(op_insert, op_delete)
    assert transformed_insert["position"] == 6

    step1 = engine.apply_operation(doc, op_delete)
    assert step1 == "Hello "
    final_text = engine.apply_operation(step1, transformed_insert)
    assert final_text == "Hello Great "
