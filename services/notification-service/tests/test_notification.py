import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_send_email():
    resp = client.post("/api/v1/notifications/send", json={
        "type": "EMAIL",
        "recipient": "test@example.com",
        "subject": "Test",
        "content": "Hello World"
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "DELIVERED"

def test_list_templates():
    resp = client.get("/api/v1/notifications/templates")
    assert resp.status_code == 200
    assert len(resp.json()["templates"]) > 0
