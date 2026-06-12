import pytest
from services.currency_service import CurrencyService


@pytest.fixture
def service():
    return CurrencyService()


def test_usd_to_eur(service):
    result = service.convert(100.0, "USD", "EUR")
    assert result["fromCurrency"] == "USD"
    assert result["toCurrency"] == "EUR"
    assert result["convertedAmount"] > 0
    assert result["rate"] > 0


def test_same_currency(service):
    result = service.convert(100.0, "USD", "USD")
    assert result["convertedAmount"] == 100.0
    assert result["rate"] == 1.0


def test_unsupported_currency(service):
    with pytest.raises(ValueError):
        service.convert(100.0, "USD", "XYZ")


def test_get_rates(service):
    result = service.get_rates("USD")
    assert result["base"] == "USD"
    assert "EUR" in result["rates"]
    assert result["rates"]["USD"] == 1.0


def test_supported_currencies(service):
    currencies = service.get_supported_currencies()
    assert "USD" in currencies
    assert "EUR" in currencies
    assert sorted(currencies) == currencies
