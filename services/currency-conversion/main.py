from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
from contextlib import asynccontextmanager
import structlog

from routers import currency_router
from config import settings

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("currency_service_starting")
    yield


app = FastAPI(
    title="NexusPay Currency Conversion Service",
    description="Real-time currency conversion with exchange rate management",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": "currency-conversion", "version": "1.0.0"}


@app.get("/ready", tags=["Health"])
async def ready():
    return {"status": "ready"}


@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


app.include_router(currency_router.router, prefix="/api/v1")
