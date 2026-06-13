import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"


def test_generate_report():
    payload = {
        "report_type": "PAYMENT_SUMMARY",
        "merchant_id": "merchant-001",
        "start_date": "2026-06-01",
        "end_date": "2026-06-30",
        "format": "JSON",
    }
    r = client.post("/api/v1/reports/generate", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "report_id" in data
    assert data["status"] in ("QUEUED", "PROCESSING", "COMPLETED")


def test_generate_report_missing_type():
    r = client.post("/api/v1/reports/generate", json={"merchant_id": "m1"})
    assert r.status_code == 422


def test_get_report_not_found():
    r = client.get("/api/v1/reports/nonexistent-id")
    assert r.status_code == 404


def test_list_supported_report_types():
    r = client.get("/api/v1/reports/types")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0
