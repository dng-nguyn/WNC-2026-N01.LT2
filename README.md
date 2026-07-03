# Coffee Shop POS

Full-stack point-of-sale and management system for coffee shops. Built with NestJS, React, and MySQL.

**Live features:** Menu management, table management (CRUD + order view), employee management, order processing, QR payment integration (Sepay/VietQR), transaction history with immutable audit trail (immudb), dashboard analytics.

## Quick Start

```bash
git clone <repo-url>
cd WNC-2026-N01.LT2
cp .env.example .env          # configure MySQL + secrets + immudb
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

Runs backend + MySQL + immudb in containers. App on port 80, MySQL and immudb internal.

**immudb** provides an immutable audit trail for all payment transactions. If `IMMUDB_HOST` is not set, the app degrades gracefully and uses MySQL only.

> **Docker permission note:** immudb runs as UID 3322. Use named volumes (default in docker-compose.yml) to avoid `permission denied` errors. If using bind mounts, run `sudo chown -R 3322:3322 /your/path`.

### 3. AWS (ECS Fargate + RDS)

Push to `main` triggers automatic deploy via GitHub Actions. Requires AWS credentials in GitHub secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

Manual trigger: `gh workflow run deploy-aws.yml`

On AWS, immudb runs as a **sidecar container** in the same ECS task — accessible at `localhost:3322`. The `IMMUDB_PASSWORD` secret is stored in AWS Secrets Manager.

See [docs/deployment.md](docs/deployment.md) for full setup instructions.

## Key Features

| Feature | Description |
|---------|-------------|
| **POS Terminal** | Takeout / table ordering with cart sidebar |
| **Tables** | View active orders per table, consolidated or split view, pay from table |
| **Manage Tables** | Add, edit, delete table names |
| **Menu Management** | CRUD for categories and menu items |
| **Payments** | QR code (Sepay/VietQR), cash, bank transfer with polling |
| **Transaction History** | All payment verifications logged, date range search, reverify via SePay |
| **immudb Audit Trail** | Immutable transaction log — survives MySQL loss |
| **Dashboard** | Sales analytics and reporting |
| **Auth** | JWT + argon2id, HTTP-only cookies, role-based access |

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
| Audit Log | immudb (immutable, optional) |
| Auth | JWT + argon2id, HTTP-only cookies |
| Payment | Sepay API + VietQR |
| Hosting | AWS ECS Fargate + RDS + Cloudflare |
