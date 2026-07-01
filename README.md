# Coffee Shop POS

Full-stack point-of-sale and management system for coffee shops. Built with NestJS, React, and MySQL.

**Live features:** Menu management, table management, employee management, order processing, QR payment integration (Sepay/VietQR), dashboard analytics.

## Quick Start

```bash
git clone <repo-url>
cd WNC-2026-N01.LT2
cp .env.example .env          # configure MySQL + secrets
npm install
npm run start:dev             # backend on :3000
cd frontend && npm install && npm run dev  # frontend on :5173
```

Swagger API docs: `http://localhost:3000/api/docs`

## Deploy

Three deployment methods are supported:

### 1. From Source

```bash
cp .env.example .env && npm install && npm run build && npm run start:prod
cd frontend && npm install && npm run build   # serve dist/ with nginx
```

### 2. Docker Compose

```bash
cp .env.example .env
docker compose up -d
```

Runs backend + MySQL in containers. App on port 80, MySQL internal.

### 3. AWS (ECS Fargate + RDS)

Push to `main` triggers automatic deploy via GitHub Actions. Requires AWS credentials in GitHub secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

Manual trigger: `gh workflow run deploy-aws.yml`

See [docs/deployment.md](docs/deployment.md) for full setup instructions.

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/architecture.md) | System design, modules, auth flow |
| [Getting Started](docs/getting-started.md) | Developer onboarding |
| [API Reference](docs/api-reference.md) | REST endpoints |
| [Database](docs/database.md) | Schema and relationships |
| [Environment Variables](docs/environment-variables.md) | Configuration reference |
| [Deployment](docs/deployment.md) | All three deploy methods |
| [CI/CD](docs/ci-cd.md) | GitHub Actions pipelines |
| [Runbook](docs/runbook.md) | Troubleshooting and operations |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, TypeScript, TypeORM 0.3 |
| Frontend | React 19, Vite 6, TypeScript |
| Database | MySQL 8 |
| Auth | JWT + argon2id, HTTP-only cookies |
| Payment | Sepay API + VietQR |
| Hosting | AWS ECS Fargate + RDS + Cloudflare |
