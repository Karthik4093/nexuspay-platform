from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid, structlog

router = APIRouter(prefix="/notifications", tags=["Notifications"])
logger = structlog.get_logger()


class SendRequest(BaseModel):
    type: str  # EMAIL, SMS, WEBHOOK, PUSH
    recipient: str
    subject: Optional[str] = None
    content: str
    metadata: Optional[Dict[str, Any]] = None


class SendResponse(BaseModel):
    notificationId: str
    status: str
    deliveredAt: Optional[str] = None


@router.post("/send", response_model=SendResponse)
async def send_notification(request: SendRequest):
    notification_id = str(uuid.uuid4())
    logger.info("notification_sent", type=request.type, recipient=request.recipient[:10] + "***")
    # In production: integrate with SendGrid, Twilio, etc.
    return {
        "notificationId": notification_id,
        "status": "DELIVERED",
        "deliveredAt": None,
    }


@router.get("/templates")
async def list_templates():
    return {"templates": [
        {"id": "payment_success", "name": "Payment Success", "type": "EMAIL"},
        {"id": "payment_failed", "name": "Payment Failed", "type": "EMAIL"},
        {"id": "refund_processed", "name": "Refund Processed", "type": "EMAIL"},
        {"id": "fraud_alert", "name": "Fraud Alert", "type": "SMS"},
    ]}
