import pytest
from services.tax_service import TaxService


@pytest.fixture
def service():
    return TaxService()


def test_us_general_tax(service):
    result = service.calculate(100.0, "US", "GENERAL")
    assert result["taxRate"] == 0.08
    assert result["taxAmount"] == 8.0
    assert result["netAmount"] == 92.0


def test_gb_vat(service):
    result = service.calculate(100.0, "GB", "GENERAL")
    assert result["taxRate"] == 0.20
    assert result["taxAmount"] == 20.0


def test_food_zero_rate_us(service):
    result = service.calculate(50.0, "US", "FOOD")
    assert result["taxRate"] == 0.0
    assert result["taxAmount"] == 0.0


def test_unknown_country_default(service):
    result = service.calculate(100.0, "ZZ")
    assert result["taxRate"] == 0.10


def test_breakdown_present(service):
    result = service.calculate(100.0, "DE", "GENERAL")
    assert len(result["breakdown"]) > 0
    assert result["breakdown"][0]["type"] == "GENERAL"
