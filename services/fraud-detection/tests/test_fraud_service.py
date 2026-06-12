import pytest
from services.fraud_service import FraudService


@pytest.fixture
def service():
    return FraudService()


class MockRequest:
    def __init__(self, payment_id="p1", amount=100.0, currency="USD",
                 customer_id=None, merchant_id="m1", ip_address=None, metadata=None):
        self.paymentId = payment_id
        self.amount = amount
        self.currency = currency
        self.customerId = customer_id
        self.merchantId = merchant_id
        self.ipAddress = ip_address
        self.metadata = metadata


def test_low_risk_payment(service):
    req = MockRequest(amount=50.0, customer_id="c1")
    result = service.check(req)
    assert result["risk"] == "LOW"
    assert result["recommendation"] == "APPROVE"
    assert result["score"] < 30


def test_high_amount_flag(service):
    req = MockRequest(amount=10000.0, customer_id="c1")
    result = service.check(req)
    assert "HIGH_AMOUNT" in result["flags"]
    assert result["score"] >= 30


def test_anonymous_high_value(service):
    req = MockRequest(amount=1500.0, customer_id=None)
    result = service.check(req)
    assert "ANONYMOUS_HIGH_VALUE" in result["flags"]


def test_high_risk_country(service):
    req = MockRequest(amount=100.0, metadata={"country": "NG"})
    result = service.check(req)
    assert "HIGH_RISK_COUNTRY" in result["flags"]
    assert result["recommendation"] in ["REVIEW", "REJECT"]


def test_score_capped_at_100(service):
    req = MockRequest(amount=99999.0, metadata={"country": "KP"})
    result = service.check(req)
    assert result["score"] <= 100.0


def test_analysis_id_present(service):
    req = MockRequest()
    result = service.check(req)
    assert "analysisId" in result
    assert len(result["analysisId"]) == 36


def test_get_rules(service):
    rules = service.get_rules()
    assert len(rules) > 0
    assert all("name" in r for r in rules)
