from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import random
import uuid

router = APIRouter(prefix="", tags=["AI Scoring"])


class ScoreRequest(BaseModel):
    entityType: str  # MERCHANT, CUSTOMER, TRANSACTION
    entityId: Optional[str] = None
    features: Optional[Dict[str, Any]] = None


class ScoreResponse(BaseModel):
    score: float
    confidence: float
    category: str
    scoreId: str
    breakdown: List[Dict[str, Any]]


@router.post("/score", response_model=ScoreResponse)
async def score(request: ScoreRequest):
    score = round(random.uniform(0.1, 0.99), 4)
    confidence = round(random.uniform(0.7, 0.98), 4)

    if score > 0.75:
        category = "HIGH_QUALITY"
    elif score > 0.5:
        category = "MEDIUM_QUALITY"
    else:
        category = "LOW_QUALITY"

    return {
        "score": score,
        "confidence": confidence,
        "category": category,
        "scoreId": str(uuid.uuid4()),
        "breakdown": [
            {"feature": "transaction_history", "weight": 0.35, "contribution": round(score * 0.35, 4)},
            {"feature": "behavior_pattern", "weight": 0.30, "contribution": round(score * 0.30, 4)},
            {"feature": "risk_profile", "weight": 0.25, "contribution": round(score * 0.25, 4)},
            {"feature": "network_signals", "weight": 0.10, "contribution": round(score * 0.10, 4)},
        ],
    }


@router.get("/models")
async def list_models():
    return {"models": [
        {"id": "merchant_quality_v2", "type": "MERCHANT", "accuracy": 0.923, "version": "2.1.0"},
        {"id": "customer_risk_v3", "type": "CUSTOMER", "accuracy": 0.891, "version": "3.0.1"},
        {"id": "transaction_score_v1", "type": "TRANSACTION", "accuracy": 0.956, "version": "1.2.0"},
    ]}


@router.post("/batch-score")
async def batch_score(requests: List[ScoreRequest]):
    results = []
    for req in requests:
        score = round(random.uniform(0.1, 0.99), 4)
        results.append({"entityId": req.entityId, "score": score, "category": "MEDIUM_QUALITY" if score > 0.5 else "LOW_QUALITY"})
    return {"results": results, "total": len(results)}
