from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import structlog
from services.fraud_service import FraudService

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])
logger = structlog.get_logger()
fraud_service = FraudService()


class FraudCheckRequest(BaseModel):
    paymentId: str
    amount: float
    currency: str
    customerId: Optional[str] = None
    merchantId: str
    ipAddress: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class FraudCheckResponse(BaseModel):
    score: float
    risk: str
    recommendation: str
    flags: List[str]
    paymentId: str
    analysisId: str


class BatchFraudCheckRequest(BaseModel):
    payments: List[FraudCheckRequest]


@router.post("/check", response_model=FraudCheckResponse)
async def check_fraud(
    request: FraudCheckRequest,
    x_correlation_id: Optional[str] = Header(None),
):
    logger.info("fraud_check_request", payment_id=request.paymentId, amount=request.amount, correlation_id=x_correlation_id)
    result = fraud_service.check(request)
    logger.info("fraud_check_result", payment_id=request.paymentId, score=result["score"], risk=result["risk"])
    return result


@router.post("/batch-check")
async def batch_check(request: BatchFraudCheckRequest):
    results = [fraud_service.check(p) for p in request.payments]
    return {"results": results, "total": len(results)}


@router.get("/rules")
async def get_rules():
    return {"rules": fraud_service.get_rules()}
