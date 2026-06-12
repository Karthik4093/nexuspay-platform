# Changelog

All notable changes to NexusPay Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-13

### Added
- Initial release of NexusPay Payment Orchestration Platform
- Node.js API Gateway with Fastify and TypeScript
- 10 Python FastAPI microservices (Fraud, Currency, Tax, Notification, Reports, Analytics, Recommendation, Inventory, Document, AI Scoring)
- PostgreSQL database with Prisma ORM and full migration support
- Redis for caching, sessions, and JWT blacklisting
- RabbitMQ for event-driven messaging
- BullMQ for background job processing
- Transactional Outbox Pattern for reliable event publishing
- Circuit breaker pattern for Python service calls
- JWT authentication with refresh token rotation
- RBAC with Admin, Merchant, Support roles
- Complete payment orchestration flow (create → fraud check → tax → currency → notify)
- Idempotency key support for duplicate prevention
- Distributed tracing with OpenTelemetry
- Prometheus metrics and Grafana dashboards
- Alert rules for SLA monitoring
- Vanilla JavaScript frontend with 6 pages
- Terraform infrastructure modules
- GitHub Actions CI/CD pipelines
- Complete documentation suite
- Docker Compose for single-command deployment
- Seed scripts with realistic test data
