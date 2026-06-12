# Contributing to NexusPay

Thank you for your interest in contributing!

## Development Setup

1. Fork and clone the repository
2. Follow the Quick Start guide in README.md
3. Create a feature branch: `git checkout -b feature/your-feature`

## Code Standards

### Node.js / TypeScript
- TypeScript strict mode enabled
- ESLint + Prettier enforced
- Run `npm run lint` before committing
- Run `npm test` to ensure tests pass

### Python
- Follow PEP 8
- Type hints required
- Run `pytest` before committing

### Commits
Follow Conventional Commits:
- `feat: add payment analytics endpoint`
- `fix: handle null merchant in payment create`
- `docs: update API reference`
- `test: add unit tests for auth service`

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure CI passes
4. Request review from maintainers

## Adding a New Python Service

1. Copy an existing service structure (e.g., `services/fraud-detection/`)
2. Update port number (next available from 8010+)
3. Add service to `docker-compose.yml`
4. Add health check endpoint (`GET /health`)
5. Update `src/integrations/python-services.ts`
6. Update prometheus.yml scrape targets
7. Add Dockerfile
8. Write tests

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
