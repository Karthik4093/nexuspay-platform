import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_score_transaction():
    payload = {
        "transaction_id": "txn-001",
        "amount": 250.0,
        "currency": "USD",
        "payment_method": "CREDIT_CARD",
        "merchant_id": "merchant-001",
        "customer_id": "cust-001",
        "country": "US",
        "features": {
            "velocity_1h": 1,
            "velocity_24h": 3,
            "avg_transaction_amount": 200.0,
        },
    }
    r = client.post("/api/v1/ai/score", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "score" in data
    assert 0.0 <= data["score"] <= 1.0
    assert "risk_level" in data
    assert "model_version" in data


def test_batch_score():
    payload = {
        "transactions": [
            {"transaction_id": f"txn-{i}", "amount": 100 + i * 10, "currency": "USD"}
            for i in range(5)
        ]
    }
    r = client.post("/api/v1/ai/batch-score", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert len(data["results"]) == 5


def test_list_models():
    r = client.get("/api/v1/ai/models")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_score_missing_transaction_id():
    r = client.post("/api/v1/ai/score", json={"amount": 100})
    assert r.status_code == 422
