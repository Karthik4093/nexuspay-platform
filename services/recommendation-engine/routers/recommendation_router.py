from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import random

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


class RecommendationRequest(BaseModel):
    merchantId: str
    customerId: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


@router.post("/payment-methods")
async def recommend_payment_methods(request: RecommendationRequest):
    methods = [
        {"method": "CARD", "score": round(random.uniform(0.7, 0.99), 3), "reason": "Most used by this customer"},
        {"method": "WALLET", "score": round(random.uniform(0.5, 0.8), 3), "reason": "Faster checkout"},
        {"method": "BANK_TRANSFER", "score": round(random.uniform(0.3, 0.6), 3), "reason": "Lower fees"},
    ]
    methods.sort(key=lambda x: x["score"], reverse=True)
    return {"recommendations": methods, "merchantId": request.merchantId}


@router.get("/fraud-rules/{merchantId}")
async def recommend_fraud_rules(merchantId: str):
    return {"merchantId": merchantId, "recommendations": [
        {"rule": "Enable 3DS for transactions > $500", "priority": "HIGH", "expectedFraudReduction": 0.35},
        {"rule": "Require address verification", "priority": "MEDIUM", "expectedFraudReduction": 0.15},
    ]}


@router.get("/pricing/{merchantId}")
async def recommend_pricing(merchantId: str):
    return {"merchantId": merchantId, "currentFee": 0.029, "recommendedFee": 0.025, "potentialSavings": 1250.0}
