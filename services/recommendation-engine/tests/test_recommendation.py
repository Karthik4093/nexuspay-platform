import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_payment_method_recommendations():
    payload = {
        "merchant_id": "merchant-001",
        "customer_id": "cust-001",
        "amount": 150.0,
        "currency": "USD",
        "country": "US",
    }
    r = client.post("/api/v1/recommendations/payment-methods", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


def test_fraud_rule_suggestions():
    payload = {
        "merchant_id": "merchant-001",
        "recent_fraud_rate": 0.05,
    }
    r = client.post("/api/v1/recommendations/fraud-rules", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "rules" in data


def test_pricing_recommendations():
    payload = {
        "merchant_id": "merchant-001",
        "category": "E_COMMERCE",
        "monthly_volume": 50000,
    }
    r = client.post("/api/v1/recommendations/pricing", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "recommendations" in data


def test_missing_merchant_id():
    r = client.post("/api/v1/recommendations/payment-methods", json={"amount": 10})
    assert r.status_code == 422
