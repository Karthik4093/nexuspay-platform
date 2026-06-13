import io
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_upload_text_document():
    content = b"Invoice #12345\nAmount: $500.00\nDate: 2026-06-13"
    r = client.post(
        "/api/v1/documents/upload",
        files={"file": ("invoice.txt", io.BytesIO(content), "text/plain")},
        data={"document_type": "INVOICE"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "document_id" in data
    assert "extracted_fields" in data


def test_upload_no_file():
    r = client.post("/api/v1/documents/upload", data={"document_type": "INVOICE"})
    assert r.status_code == 422


def test_get_document_not_found():
    r = client.get("/api/v1/documents/nonexistent-doc-id")
    assert r.status_code == 404


def test_analyze_document():
    payload = {
        "document_id": "doc-001",
        "analysis_type": "EXTRACT_TOTALS",
    }
    r = client.post("/api/v1/documents/analyze", json=payload)
    assert r.status_code in (200, 404)
