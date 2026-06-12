# ⚡ NexusPay — Enterprise Payment Orchestration Platform

[![CI](https://github.com/your-org/nexuspay-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/nexuspay-platform/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)

A production-grade, distributed Payment Orchestration Platform built with Node.js (Fastify), Python (FastAPI), PostgreSQL, Redis, RabbitMQ, BullMQ, OpenTelemetry, Prometheus, and Grafana.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NexusPay Platform                             │
│                                                                   │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────────────┐ │
│  │  Frontend   │───▶│  API Gateway  │───▶│  Python Services   │ │
│  │ Vanilla JS  │    │  Fastify/TS   │    │  (10 FastAPI svcs) │ │
│  └────────────┘    └──────┬───────┘    └─────────────────────┘ │
│                            │                                       │
│                    ┌───────┴────────┐                             │
│                    │                │                              │
│            ┌───────▼──────┐  ┌─────▼──────┐                     │
│            │  PostgreSQL   │  │   Redis     │                     │
│            │   (Prisma)    │  │  (Cache)    │                     │
│            └──────────────┘  └─────────────┘                     │
│                                                                   │
│            ┌──────────────┐  ┌─────────────┐                    │
│            │   RabbitMQ   │  │   BullMQ     │                    │
│            │  (Events)    │  │  (Workers)   │                    │
│            └──────────────┘  └─────────────┘                     │
│                                                                   │
│            ┌──────────────┐  ┌─────────────┐                    │
│            │  Prometheus  │  │   Grafana    │                    │
│            │  (Metrics)   │  │ (Dashboards) │                    │
│            └──────────────┘  └─────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) >= 24.0
- [Docker Compose](https://docs.docker.com/compose/) >= 2.20
- [Node.js](https://nodejs.org/) >= 20 (for local development)
- [Python](https://python.org/) >= 3.11 (for local development)

### Start the Entire Platform

```bash
# 1. Clone the repository
git clone https://github.com/your-org/nexuspay-platform.git
cd nexuspay-platform

# 2. Copy environment file
cp .env.example .env

# 3. Start all services (single command!)
docker compose up -d

# 4. Wait for migrations to complete (~30 seconds)
docker compose logs migrate -f

# 5. Access the platform
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:8080 | See below |
| API Gateway | http://localhost:3000 | - |
| API Docs (Swagger) | http://localhost:3000/api/docs | - |
| Grafana | http://localhost:3001 | admin / nexuspay_grafana |
| Prometheus | http://localhost:9090 | - |
| RabbitMQ | http://localhost:15672 | nexuspay / nexuspay_secret |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nexuspay.com | Admin@123456 |
| Merchant | billing@techcorp.com | Merchant@123456 |
| Support | support@nexuspay.com | Support@123456 |

---

## 📦 Services

### Core Services

| Service | Technology | Port | Description |
|---------|-----------|------|-------------|
| API Gateway | Node.js + Fastify | 3000 | Main API entry point |
| Worker | Node.js | - | BullMQ workers |
| Frontend | Nginx + Vanilla JS | 8080 | Web UI |

### Python Microservices

| Service | Port | Description |
|---------|------|-------------|
| Fraud Detection | 8001 | ML-based fraud scoring |
| Currency Conversion | 8002 | Real-time FX rates |
| Tax Calculation | 8003 | Multi-jurisdiction tax |
| Notification | 8004 | Email/SMS/Webhook |
| Report Generation | 8005 | Business reports |
| Analytics | 8006 | Payment analytics |
| Recommendation Engine | 8007 | Payment optimization |
| Inventory Forecast | 8008 | Demand forecasting |
| Document Processing | 8009 | Document analysis |
| AI Scoring | 8010 | ML entity scoring |

### Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache + sessions |
| RabbitMQ | 5672/15672 | Message broker |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3001 | Dashboards |
| OpenTelemetry | 4317/4318 | Distributed tracing |

---

## 🔒 API Reference

### Authentication

```bash
# Register
POST /api/v1/auth/register

# Login
POST /api/v1/auth/login

# Refresh Token
POST /api/v1/auth/refresh

# Logout
POST /api/v1/auth/logout

# Change Password
POST /api/v1/auth/change-password

# Forgot Password
POST /api/v1/auth/forgot-password

# Reset Password
POST /api/v1/auth/reset-password
```

### Payments

```bash
# Create Payment
POST /api/v1/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD",
  "paymentMethod": "CARD",
  "idempotencyKey": "unique-key-here",
  "description": "Order payment"
}

# List Payments
GET /api/v1/payments?page=1&limit=20&status=SUCCESS

# Get Payment
GET /api/v1/payments/:id

# Cancel Payment
POST /api/v1/payments/:id/cancel

# Payment Stats
GET /api/v1/payments/stats
```

---

## 🧪 Running Tests

```bash
# Node.js tests
npm test                          # Unit tests
npm run test:coverage            # With coverage
npm run test:integration         # Integration tests

# Python tests
cd services/fraud-detection
python -m pytest tests/ -v

cd services/currency-conversion
python -m pytest tests/ -v

cd services/tax-calculation
python -m pytest tests/ -v
```

---

## 🏗️ Local Development

```bash
# Start infrastructure only
docker compose up postgres redis rabbitmq -d

# Install Node.js dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# Seed database
npm run db:seed

# Start API in dev mode
npm run dev

# Start worker
npx tsx src/worker.ts
```

---

## 📊 Payment Flow

```
1. POST /api/v1/payments
        │
        ▼
2. Validate Request (Zod)
        │
        ▼
3. Check Idempotency Key (PostgreSQL)
        │
        ▼
4. Begin Transaction
   ├── Create Payment (PENDING)
   ├── Save Outbox Event
   └── Create Audit Log
        │
        ▼
5. Queue Payment Processing (BullMQ)
        │
        ▼
6. Worker picks up job
   ├── Mark PROCESSING
   ├── Call Fraud Detection Service
   ├── Call Tax Calculation Service
   ├── Call Currency Conversion Service
   ├── Update Payment (SUCCESS/FAILED)
   ├── Create Audit Log
   └── Queue Notification
        │
        ▼
7. Outbox Publisher (every 5s)
   └── Publish to RabbitMQ
        │
        ▼
8. Notification Worker
   └── Call Notification Service
```

---

## 🐳 Docker Commands

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f api

# Scale workers
docker compose up --scale worker=3 -d

# Stop everything
docker compose down

# Reset database
docker compose down -v
docker compose up postgres -d
docker compose run --rm migrate
```

---

## 📁 Project Structure

```
nexuspay-platform/
├── src/                        # Node.js API Gateway
│   ├── modules/               # Feature modules
│   ├── services/              # Business logic
│   ├── repositories/          # Data access
│   ├── middleware/            # Fastify middleware
│   ├── validators/            # Zod schemas
│   ├── queues/               # Redis, RabbitMQ, BullMQ
│   ├── workers/              # BullMQ workers
│   ├── schedulers/           # Cron schedulers
│   ├── integrations/         # Python service clients
│   ├── telemetry/            # OpenTelemetry
│   └── utils/                # Shared utilities
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seeds/                 # Seed scripts
├── services/                  # Python microservices (×10)
├── frontend/                  # Vanilla JS frontend
├── monitoring/               # Prometheus, Grafana, OTel
├── terraform/                # Infrastructure as Code
├── .github/workflows/        # CI/CD pipelines
└── scripts/                  # Automation scripts
```

---

## 🔐 Security

- JWT with refresh token rotation
- RBAC (Admin, Merchant, Support)
- Rate limiting per IP
- Password hashing (bcrypt)
- Token blacklisting (Redis)
- SQL injection protection (Prisma)
- Input validation (Zod)
- CORS + Helmet headers
- Idempotency keys for payment deduplication

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
