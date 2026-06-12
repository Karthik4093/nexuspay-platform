from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
from contextlib import asynccontextmanager
from routers import notification_router

@asynccontextmanager
async def lifespan(app): yield

app = FastAPI(title="NexusPay Notification Service", version="1.0.0", lifespan=lifespan, docs_url="/api/docs")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health", tags=["Health"])
async def health(): return {"status": "healthy", "service": "notification", "version": "1.0.0"}

@app.get("/ready", tags=["Health"])
async def ready(): return {"status": "ready"}

@app.get("/metrics")
async def metrics(): return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

app.include_router(notification_router.router, prefix="/api/v1")
