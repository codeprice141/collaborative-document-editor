#!/usr/bin/env python3
import asyncio
import json
import httpx
import websockets
import time

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/api/v1/ws/documents"


async def setup_users_and_document():
    suffix = str(int(time.time()))
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Register User 1 (Alice - Owner)
        await client.post("/api/v1/auth/register", json={
            "email": f"alice_{suffix}@tribe.com", "password": "password123", "full_name": "Alice Cave"
        })
        res_a = await client.post("/api/v1/auth/login", json={"email": f"alice_{suffix}@tribe.com", "password": "password123"})
        token_a = res_a.json()["access_token"]

        # Register User 2 (Bob - Editor)
        await client.post("/api/v1/auth/register", json={
            "email": f"bob_{suffix}@tribe.com", "password": "password123", "full_name": "Bob Cave"
        })
        res_b = await client.post("/api/v1/auth/login", json={"email": f"bob_{suffix}@tribe.com", "password": "password123"})
        token_b = res_b.json()["access_token"]

        # Register User 3 (Charlie - Editor)
        await client.post("/api/v1/auth/register", json={
            "email": f"charlie_{suffix}@tribe.com", "password": "password123", "full_name": "Charlie Cave"
        })
        res_c = await client.post("/api/v1/auth/login", json={"email": f"charlie_{suffix}@tribe.com", "password": "password123"})
        token_c = res_c.json()["access_token"]

        # Alice creates document
        doc_res = await client.post(
            "/api/v1/documents/",
            json={"title": "Caveman Manifesto", "content": "Tribe Rules: "},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        doc_id = doc_res.json()["id"]

        # Alice shares document with Bob & Charlie as EDITORS
        await client.post(
            f"/api/v1/documents/{doc_id}/share",
            json={"email": f"bob_{suffix}@tribe.com", "role": "editor"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        await client.post(
            f"/api/v1/documents/{doc_id}/share",
            json={"email": f"charlie_{suffix}@tribe.com", "role": "editor"},
            headers={"Authorization": f"Bearer {token_a}"},
        )

        return doc_id, token_a, token_b, token_c


async def simulate_client(name: str, token: str, doc_id: int, client_id: str, insert_text: str, delay: float):
    uri = f"{WS_URL}/{doc_id}?token={token}&client_id={client_id}"
    async with websockets.connect(uri) as ws:
        init_raw = await ws.recv()
        init_msg = json.loads(init_raw)
        init_content = init_msg.get("content", "")
        init_version = init_msg.get("version", 0)
        print(f"[{name}] Connected! Initial: '{init_content}' (v{init_version})")

        # Send cursor update
        await ws.send(json.dumps({
            "type": "cursor",
            "cursor": {"index": 13},
            "is_typing": True
        }))

        await asyncio.sleep(delay)

        # Send operation
        op_msg = {
            "type": "operation",
            "operation": {
                "op_type": "insert",
                "position": 13,
                "text": insert_text,
                "client_version": init_version
            }
        }
        print(f"[{name}] Sending: '{insert_text}'")
        await ws.send(json.dumps(op_msg))

        # Listen for broadcast events
        start = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start < 1.5:
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=0.8)
                msg = json.loads(raw)
                msg_t = msg.get("type")
                if msg_t == "operation_broadcast":
                    txt = msg["operation"].get("text", "")
                    ver = msg.get("version")
                    print(f"[{name}] Broadcast: text='{txt}' -> v{ver}")
                elif msg_t == "operation_ack":
                    s_ver = msg.get("server_version")
                    print(f"[{name}] ACK received! Server version: {s_ver}")
            except asyncio.TimeoutError:
                break


async def main():
    print("=== Starting 3-User Realtime Collaborative Simulation ===")
    doc_id, token_a, token_b, token_c = await setup_users_and_document()
    print(f"Document ID {doc_id} created and shared with 3 users.\n")

    await asyncio.gather(
        simulate_client("Alice (Owner)", token_a, doc_id, "alice_cli", "1. Make fire. ", 0.05),
        simulate_client("Bob (Editor)", token_b, doc_id, "bob_cli", "2. Hunt mammoth. ", 0.15),
        simulate_client("Charlie (Editor)", token_c, doc_id, "charlie_cli", "3. Share meat. ", 0.25),
    )

    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        res = await client.get(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {token_a}"})
        final_doc = res.json()
        print(f"\n🎉 Final Converged Document State (v{final_doc['version']}):")
        print(f"\"{final_doc['content']}\"")
        print("=== Simulation Finished Successfully! ===")


if __name__ == "__main__":
    asyncio.run(main())
