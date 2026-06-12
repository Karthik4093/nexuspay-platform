from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/reports", tags=["Report Generation"])


class ReportRequest(BaseModel):
    type: str
    merchantId: Optional[str] = None
    startDate: str
    endDate: str
    parameters: Optional[Dict[str, Any]] = None


@router.post("/generate")
async def generate_report(request: ReportRequest):
    report_id = str(uuid.uuid4())
    return {
        "reportId": report_id,
        "type": request.type,
        "status": "GENERATING",
        "estimatedCompletion": datetime.now(timezone.utc).isoformat(),
        "downloadUrl": f"/api/v1/reports/{report_id}/download",
    }


@router.get("/{report_id}")
async def get_report(report_id: str):
    return {
        "reportId": report_id,
        "status": "COMPLETED",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {"totalTransactions": 150, "totalVolume": 25000.00, "successRate": 0.95},
    }


@router.get("/types")
async def get_report_types():
    return {"types": ["DAILY_SUMMARY", "MERCHANT_SUMMARY", "PAYMENT_REPORT", "AUDIT_REPORT", "REVENUE_REPORT"]}
