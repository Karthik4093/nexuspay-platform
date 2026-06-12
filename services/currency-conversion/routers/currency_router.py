from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional, List
from services.currency_service import CurrencyService

router = APIRouter(prefix="/currency", tags=["Currency Conversion"])
service = CurrencyService()


class ConvertRequest(BaseModel):
    amount: float
    fromCurrency: str
    toCurrency: str


class ConvertResponse(BaseModel):
    convertedAmount: float
    rate: float
    fromCurrency: str
    toCurrency: str
    timestamp: str


class RatesResponse(BaseModel):
    base: str
    rates: dict
    timestamp: str


@router.post("/convert", response_model=ConvertResponse)
async def convert(request: ConvertRequest, x_correlation_id: Optional[str] = Header(None)):
    return service.convert(request.amount, request.fromCurrency, request.toCurrency)


@router.get("/rates/{base}")
async def get_rates(base: str):
    return service.get_rates(base.upper())


@router.get("/supported")
async def get_supported():
    return {"currencies": service.get_supported_currencies()}
