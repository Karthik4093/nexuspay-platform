import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_forecast_default_horizon():
    payload = {
        "merchant_id": "merchant-001",
        "product_id": "prod-123",
        "historical_sales": [100, 120, 95, 130, 110],
    }
    r = client.post("/api/v1/inventory/forecast", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "forecast" in data
    assert "horizon_days" in data
    assert len(data["forecast"]) == data["horizon_days"]


def test_forecast_custom_horizon():
    payload = {
        "merchant_id": "merchant-001",
        "product_id": "prod-456",
        "historical_sales": [50, 60, 45, 70],
        "horizon_days": 14,
    }
    r = client.post("/api/v1/inventory/forecast", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["horizon_days"] == 14


def test_low_stock_alert():
    payload = {
        "merchant_id": "merchant-001",
        "product_id": "prod-789",
        "historical_sales": [200, 210, 195, 220],
        "current_stock": 5,
    }
    r = client.post("/api/v1/inventory/forecast", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "alerts" in data


def test_missing_historical_sales():
    r = client.post("/api/v1/inventory/forecast", json={"merchant_id": "m1"})
    assert r.status_code == 422
