from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/documents", tags=["Document Processing"])


class ExtractRequest(BaseModel):
    documentId: str
    type: str


class DocumentAnalysis(BaseModel):
    documentId: str
    type: str
    extractedData: Dict[str, Any]
    confidence: float
    processingTime: float


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    document_id = str(uuid.uuid4())
    content = await file.read()
    return {
        "documentId": document_id,
        "filename": file.filename,
        "size": len(content),
        "contentType": file.content_type,
        "status": "UPLOADED",
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/analyze")
async def analyze_document(request: ExtractRequest):
    return {
        "documentId": request.documentId,
        "type": request.type,
        "extractedData": {
            "invoice_number": "INV-2024-001",
            "amount": 1250.00,
            "currency": "USD",
            "date": "2024-01-15",
            "vendor": "Tech Corp",
        },
        "confidence": 0.94,
        "processingTime": 0.342,
    }


@router.get("/supported-types")
async def get_supported_types():
    return {"types": ["INVOICE", "RECEIPT", "CONTRACT", "IDENTITY_DOC", "BANK_STATEMENT"]}
