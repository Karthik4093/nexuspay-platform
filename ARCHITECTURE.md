# NexusPay Platform Architecture

## Overview

NexusPay is a distributed payment orchestration platform built using Clean Architecture principles, microservices patterns, and event-driven design.

## Core Design Principles

1. **Clean Architecture** — Business logic is decoupled from frameworks and infrastructure
2. **Repository Pattern** — Data access is abstracted behind repositories
3. **Service Layer** — Business logic lives in service classes
4. **Dependency Injection** — Services receive dependencies through constructors
5. **SOLID Principles** — Every module has a single responsibility

## Node.js API Gateway Architecture

```
src/
├── modules/          # Feature-organized API modules
│   ├── auth/         # Authentication & authorization
│   ├── merchants/    # Merchant management
│   ├── customers/    # Customer management
│   ├── payments/     # Payment orchestration
│   ├── refunds/      # Refund processing
│   ├── audit/        # Audit log access
│   ├── notifications/ # Notification management
│   └── reports/      # Report generation
│
├── services/         # Business logic layer
├── repositories/     # Data access layer (Prisma)
├── middleware/       # Cross-cutting concerns
├── validators/       # Input validation (Zod schemas)
├── queues/           # Message infrastructure
├── workers/          # Background job processors
├── schedulers/       # Cron job definitions
├── integrations/     # External service clients
├── telemetry/        # OpenTelemetry setup
└── utils/            # Shared utilities
```

## Event-Driven Architecture

### Transactional Outbox Pattern

Prevents message loss by ensuring events are only published after database commit:

```
1. Begin Transaction
2. Write business entity
3. Write OutboxEvent (same transaction)
4. Commit
5. Outbox publisher (cron every 5s) reads pending events
6. Publishes to RabbitMQ
7. Marks event as PUBLISHED
```

### RabbitMQ Exchange Topology

```
Exchanges:
  nexuspay.payment.events  (topic)
  nexuspay.notification.events (topic)
  nexuspay.audit.events  (topic)
  nexuspay.dead.letter  (fanout)

Bindings:
  payment.created   → nexuspay.payment.created
  payment.process.* → nexuspay.payment.process
  notification.email → nexuspay.notification.email
  notification.webhook → nexuspay.notification.webhook
```

### BullMQ Queue Architecture

```
Queues:
  payment-processing  (concurrency: 5)
  notification        (concurrency: 10)
  report-generation   (concurrency: 2)
  outbox-publisher    (cron: */5 * * * * *)
  fraud-check         (cron: */15 * * * *)
  audit-log           (concurrency: 5)
  cleanup             (cron: various)
  scheduled           (various)
```

## Circuit Breaker Pattern

All Python service calls are protected by opossum circuit breakers:

```
State Machine:
  CLOSED → OPEN: error rate > 50% over 10s window
  OPEN → HALF-OPEN: after 30s reset timeout
  HALF-OPEN → CLOSED: successful test call
  HALF-OPEN → OPEN: failed test call
```

Fallbacks:
- Fraud: returns MEDIUM risk (continue processing)
- Tax: returns 10% flat rate
- Currency: returns 1:1 rate (no conversion)
- Notification: logs warning, continues

## Security Architecture

### Authentication Flow

```
Login → bcrypt verify → JWT (15m) + RefreshToken (7d, stored in DB)
     ↓
Request → JWT verify → Redis blacklist check → Allow/Deny
     ↓
Logout → Blacklist JWT in Redis → Revoke all refresh tokens
```

### RBAC Matrix

| Resource | ADMIN | MERCHANT | SUPPORT |
|----------|-------|----------|---------|
| Merchants CRUD | ✓ | own | - |
| Customer CRUD | ✓ | own | read |
| Payments | ✓ | own | read |
| Refunds | ✓ | own | read |
| Audit Logs | ✓ | - | ✓ |
| Reports | ✓ | own | ✓ |

## Database Schema Design

Key patterns used:
- UUID primary keys (distributed-safe)
- Soft deletes (`deleted_at` column)
- Audit columns (`created_at`, `updated_at`)
- Proper indexing on foreign keys and query patterns
- Decimal types for monetary values (precision: 20, scale: 4)
- JSON metadata columns for extensibility

## Idempotency

```
Request with X-Idempotency-Key header
  ↓
Hash request body → SHA-256
  ↓
Check PostgreSQL idempotency_keys table
  ↓
If exists → return cached response
If new → process normally, save result
```

## Scheduler Architecture

| Schedule | Job | Trigger Type |
|----------|-----|--------------|
| */5 * * * * * | Outbox publisher | Interval |
| 0 * * * * | Payment reconciliation | Cron |
| 0 */3 * * * | Merchant summary | Cron |
| 0 0 * * * | Daily report | Cron |
| 0 0 * * 0 | Audit cleanup | Cron |
| 0 0 1 * * | Monthly archival | Cron |
| */15 * * * * | Fraud threshold scan | Cron |
| 0 * * * * | Revenue milestone check | Event-triggered |

## OpenTelemetry

Traces propagate across:
- HTTP requests (via headers)
- Database queries (pg instrumentation)
- Redis operations (ioredis instrumentation)
- RabbitMQ messages (amqplib instrumentation)
- BullMQ jobs (correlation IDs)
- Python service calls (HTTP headers)

## Python Service Architecture

Each service follows the same structure:
```
service/
├── main.py           # FastAPI app + middleware
├── config.py         # Pydantic settings
├── requirements.txt  # Dependencies
├── Dockerfile        # Container definition
├── routers/
│   └── *_router.py   # API routes
├── services/
│   └── *_service.py  # Business logic
└── tests/
    └── test_*.py     # Pytest tests
```
