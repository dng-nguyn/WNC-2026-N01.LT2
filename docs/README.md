# Documentation

Documentation for the Coffee Shop POS/Management System.

## Contents

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System overview, module structure, auth flow, payment flow |
| [Getting Started](./getting-started.md) | Developer onboarding: clone, setup, run, test |
| [API Reference](./api-reference.md) | All REST endpoints, request/response formats |
| [Database](./database.md) | Schema, tables, relationships, entity-to-table mapping |
| [Environment Variables](./environment-variables.md) | All config vars for backend and frontend |
| [Deployment](./deployment.md) | Three deploy methods: source, Docker, AWS ECS |
| [CI/CD](./ci-cd.md) | GitHub Actions workflows, secrets, triggers |
| [Runbook](./runbook.md) | Operational troubleshooting, scaling, teardown |
| [ADR: Entity Mapping](./adr/001-entity-table-mapping.md) | Why Menu→categories and MenuItem→products |

## Quick Links

- **Swagger docs**: `http://localhost:3000/api/docs` (dev)
- **Health check**: `GET /health` → `Hello World!`
- **Backend tests**: `npm test` (from project root)
- **Frontend tests**: `cd frontend && npm test`
