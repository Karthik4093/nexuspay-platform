# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅ Yes    |

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues.

Email: security@nexuspay.com

We will acknowledge within 48 hours and provide a detailed response within 7 business days.

## Security Measures

### Authentication & Authorization
- JWT tokens with 15-minute expiry
- Refresh token rotation (family-based revocation)
- JWT blacklisting via Redis on logout
- bcrypt password hashing (12 rounds)
- Account lockout after 5 failed login attempts
- RBAC with principle of least privilege

### API Security
- Helmet.js security headers
- CORS with explicit origin whitelist
- Rate limiting per IP (100 req/min)
- Input validation with Zod on all endpoints
- SQL injection prevention via Prisma parameterized queries
- Idempotency keys to prevent replay attacks

### Infrastructure
- Non-root Docker containers
- No secrets in Docker images or git history
- Environment variable injection at runtime
- Network isolation between services (Docker network)

### Data Protection
- Monetary amounts stored as DECIMAL(20,4) — no floating point
- Soft deletes to preserve audit trail
- Audit log for all sensitive operations
- No PII in logs (only user IDs)

## Production Checklist

- [ ] Change all default passwords in docker-compose.yml
- [ ] Generate cryptographically secure JWT secrets (32+ chars)
- [ ] Enable TLS/HTTPS
- [ ] Set CORS origin to specific domain
- [ ] Review rate limit settings
- [ ] Enable log aggregation
- [ ] Set up secret management (Vault/AWS Secrets Manager)
- [ ] Run `npm audit` before deployment
- [ ] Scan Docker images with Trivy
