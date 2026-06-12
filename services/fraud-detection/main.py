from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
import time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from routers import fraud_router
from config import settings

logger = structlog.get_logger()

REQUEST_COUNT = Counter("fraud_requests_total", "Total requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("fraud_request_duration_seconds", "Request latency", ["method", "endpoint"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("fraud_detection_service_starting", port=settings.PORT)
    yield
    logger.info("fraud_detection_service_stopping")


app = FastAPI(
    title="NexusPay Fraud Detection Service",
    description="ML-powered fraud detection and risk scoring for payment transactions",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    REQUEST_COUNT.labels(request.method, request.url.path, response.status_code).inc()
    REQUEST_LATENCY.labels(request.method, request.url.path).observe(duration)
    return response


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": "fraud-detection", "version": "1.0.0"}


@app.get("/ready", tags=["Health"])
async def ready():
    return {"status": "ready"}


@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


app.include_router(fraud_router.router, prefix="/api/v1")
