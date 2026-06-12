from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
import random

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_overview(merchantId: Optional[str] = Query(None), period: str = Query("7d")):
    return {
        "period": period,
        "merchantId": merchantId,
        "totalRevenue": round(random.uniform(50000, 500000), 2),
        "totalTransactions": random.randint(500, 5000),
        "averageTransactionValue": round(random.uniform(50, 500), 2),
        "successRate": round(random.uniform(0.90, 0.99), 4),
        "refundRate": round(random.uniform(0.01, 0.05), 4),
        "fraudRate": round(random.uniform(0.001, 0.01), 4),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/timeseries")
async def get_timeseries(metric: str = Query("revenue"), period: str = Query("7d"), merchantId: Optional[str] = Query(None)):
    points = []
    now = datetime.now(timezone.utc)
    days = int(period.replace("d", ""))
    for i in range(days):
        points.append({
            "timestamp": (now - timedelta(days=days - i)).isoformat(),
            "value": round(random.uniform(1000, 50000), 2),
        })
    return {"metric": metric, "period": period, "data": points}


@router.get("/top-merchants")
async def top_merchants(limit: int = 10):
    return {"merchants": [{"rank": i + 1, "merchantId": f"m_{i}", "revenue": round(random.uniform(10000, 100000), 2)} for i in range(limit)]}


@router.get("/payment-methods")
async def payment_method_breakdown():
    return {"breakdown": [
        {"method": "CARD", "percentage": 65.2, "count": 3260},
        {"method": "BANK_TRANSFER", "percentage": 20.1, "count": 1005},
        {"method": "WALLET", "percentage": 10.5, "count": 525},
        {"method": "UPI", "percentage": 4.2, "count": 210},
    ]}
