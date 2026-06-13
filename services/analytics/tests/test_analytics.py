import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_overview():
    r = client.get("/api/v1/analytics/overview?merchant_id=merchant-001")
    assert r.status_code == 200
    data = r.json()
    assert "total_payments" in data
    assert "total_revenue" in data
    assert "success_rate" in data


def test_overview_no_merchant():
    r = client.get("/api/v1/analytics/overview")
    assert r.status_code == 200


def test_timeseries():
    r = client.get(
        "/api/v1/analytics/timeseries"
        "?start_date=2026-06-01&end_date=2026-06-30&granularity=daily"
    )
    assert r.status_code == 200
    data = r.json()
    assert "points" in data
    assert isinstance(data["points"], list)


def test_top_merchants():
    r = client.get("/api/v1/analytics/top-merchants?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)


def test_payment_methods_breakdown():
    r = client.get("/api/v1/analytics/payment-methods")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
