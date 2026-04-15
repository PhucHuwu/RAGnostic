import os

from app.main import app
from fastapi.testclient import TestClient


def test_health() -> None:
    os.environ["APP_ENV"] = "test"
    client = TestClient(app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "rag-api"}


def test_ready() -> None:
    os.environ["APP_ENV"] = "test"
    client = TestClient(app)
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["checks"]["database"] in {"ok", "error"}
