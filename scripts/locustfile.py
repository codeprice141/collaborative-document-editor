from locust import HttpUser, task, between
import random
import string


class EditorLoadTestUser(HttpUser):
    wait_time = between(0.5, 2.0)

    def on_start(self):
        # Register a random user and login
        random_suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
        self.email = f"loaduser_{random_suffix}@loadtest.com"
        self.password = "loadpassword123"

        self.client.post("/api/v1/auth/register", json={
            "email": self.email,
            "password": self.password,
            "full_name": f"Load Tester {random_suffix}"
        })

        login_res = self.client.post("/api/v1/auth/login", json={
            "email": self.email,
            "password": self.password
        })

        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {token}"}
        else:
            self.headers = {}

        self.doc_ids = []

    @task(3)
    def create_document(self):
        if not self.headers:
            return
        res = self.client.post(
            "/api/v1/documents/",
            json={"title": "Load Test Document", "content": "Initial load test content."},
            headers=self.headers,
            name="/api/v1/documents/ [POST]"
        )
        if res.status_code == 201:
            self.doc_ids.append(res.json()["id"])

    @task(6)
    def list_documents(self):
        if not self.headers:
            return
        self.client.get(
            "/api/v1/documents/",
            headers=self.headers,
            name="/api/v1/documents/ [GET]"
        )

    @task(4)
    def get_document_details(self):
        if not self.headers or not self.doc_ids:
            return
        doc_id = random.choice(self.doc_ids)
        self.client.get(
            f"/api/v1/documents/{doc_id}",
            headers=self.headers,
            name="/api/v1/documents/{id} [GET]"
        )

    @task(2)
    def update_document(self):
        if not self.headers or not self.doc_ids:
            return
        doc_id = random.choice(self.doc_ids)
        self.client.put(
            f"/api/v1/documents/{doc_id}",
            json={"content": f"Updated content by load user at {random.randint(100, 999)}"},
            headers=self.headers,
            name="/api/v1/documents/{id} [PUT]"
        )
