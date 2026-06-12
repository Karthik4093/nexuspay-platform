from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import random

router = APIRouter(prefix="/inventory", tags=["Inventory Forecast"])


class ForecastRequest(BaseModel):
    merchantId: str
    productId: Optional[str] = None
    horizon: int = 30  # days


@router.post("/forecast")
async def forecast(request: ForecastRequest):
    forecast_data = []
    for i in range(request.horizon):
        forecast_data.append({
            "date": (datetime.now(timezone.utc) + timedelta(days=i)).strftime("%Y-%m-%d"),
            "predictedDemand": round(random.uniform(50, 500), 0),
            "confidence": round(random.uniform(0.7, 0.95), 3),
            "reorderPoint": round(random.uniform(100, 200), 0),
        })
    return {
        "merchantId": request.merchantId,
        "productId": request.productId,
        "horizon": request.horizon,
        "forecast": forecast_data,
        "summary": {
            "totalPredictedDemand": sum(d["predictedDemand"] for d in forecast_data),
            "averageDailyDemand": round(sum(d["predictedDemand"] for d in forecast_data) / request.horizon, 2),
        }
    }


@router.get("/alerts/{merchantId}")
async def get_alerts(merchantId: str):
    return {"merchantId": merchantId, "alerts": [
        {"type": "LOW_STOCK", "productId": "P001", "currentStock": 45, "reorderPoint": 100, "urgency": "HIGH"},
        {"type": "OVERSTOCK", "productId": "P002", "currentStock": 2500, "optimalStock": 500, "urgency": "MEDIUM"},
    ]}
