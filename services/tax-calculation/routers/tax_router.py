from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from services.tax_service import TaxService

router = APIRouter(prefix="/tax", tags=["Tax Calculation"])
service = TaxService()


class TaxRequest(BaseModel):
    amount: float
    currency: str
    country: str
    merchantId: str
    productType: Optional[str] = "GENERAL"


class TaxBreakdown(BaseModel):
    type: str
    rate: float
    amount: float


class TaxResponse(BaseModel):
    taxAmount: float
    taxRate: float
    netAmount: float
    breakdown: List[TaxBreakdown]


@router.post("/calculate", response_model=TaxResponse)
async def calculate_tax(request: TaxRequest):
    return service.calculate(request.amount, request.country, request.productType or "GENERAL")


@router.get("/rates/{country}")
async def get_rates(country: str):
    return service.get_rates(country.upper())
