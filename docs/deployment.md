# Deployment Guide

This document covers the three supported deployment methods for the Coffee Shop POS system. Choose the method that fits your environment.

---

## 1. From Source Code

Build and run the NestJS backend and Vite frontend directly from the repository.

### Prerequisites

- Node.js 22+
- MySQL 8.0+
- Git

### Backend

```bash
git clone https://github.com/dng-nguyn/WNC-2026-N01.LT2.git
cd WNC-2026-N01.LT2
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, SESSION_SECRET at minimum
npm install
npm run build
npm run start:prod
```

The backend listens on port 3000 by default (configurable via `PORT` in `.env`).

### Frontend

```bash
cd frontend
npm install
npm run build
```

This produces a static `dist/` directory. Serve it with nginx, Caddy, or any static file server. Point the backend `FRONTEND_URL` environment variable to wherever the frontend is hosted.

> **Note:** The frontend expects `VITE_API_BASE_URL` to point at the backend API. For production builds, set this before running `npm run build` or configure it via `.env`.

---

## 2. Docker Compose

Two compose files are available:

| File | Use case | Requires `.env`? |
|------|----------|:---:|
| `docker-compose.yml` | Local development (uses env vars with defaults) | Yes |
| `docker-compose.standalone.yml` | Self-contained deploy (inline config, no repo checkout needed) | No |

### Prerequisites

- Docker Engine 20.10+ with Compose V2

### Option A: Development (`docker-compose.yml`)

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET, SESSION_SECRET at minimum
docker compose up -d
```

### Option B: Standalone (`docker-compose.standalone.yml`)

Edit the inline values marked `CHANGE_ME` in the file, then:

```bash
docker compose -f docker-compose.standalone.yml up -d
```

### Services

| Service | Image | Exposed Port | Description |
| --- | --- | --- | --- |
| `app` | `ghcr.io/dng-nguyn/wnc-2026-n01.lt2:latest` | 80 (mapped to 3000) | NestJS backend |
| `db` | `mysql:8.0` | 3306 (internal only by default) | MySQL database |
| `immudb` | `codenotary/immudb:latest` | 3322 (gRPC), 9497 (web), 8080 (REST) | Immutable audit log (optional) |

### Volumes

- `mysql_data` — persists MySQL data across container restarts.
- `immudb_data` — persists immudb audit log. **Must be a named volume**, not a bind mount. Bind mounts cause `permission denied: open /var/lib/immudb/immudb.identifier` because immudb runs as UID 3322. If you must use bind mounts, run `sudo chown -R 3322:3322 /your/path` on the host.

### Key Details

- `DB_HOST` for the app container is `db` (Docker service DNS). Do not change this.
- The MySQL port is not exposed to the host by default. To access it for development, uncomment the `ports` mapping under the `db` service in `docker-compose.yml`.
- The app waits for the database healthcheck to pass before starting (`depends_on` with `condition: service_healthy`).
- Set `INIT_DB_SEED=true` on the first run if you want to seed the database with sample data.

---

## 3. AWS (ECS Fargate Spot + RDS)

Production deployment on AWS using ECS Fargate Spot for compute and RDS MySQL for the database. Automated via GitHub Actions — every push to `main` triggers a deploy.

### Prerequisites

The following **GitHub Repository Secrets** must be configured in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key for ECR push and ECS deploy |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key (paired with the access key above) |
| `AWS_ACCOUNT_ID` | AWS account ID (used in task definition placeholders) |
| `AWS_REGION` | AWS region for all resources (e.g. `ap-east-1`) |
| `ECR_REPOSITORY` | ECR repository name (e.g. `coffee-shop-pos`) |
| `ECS_CLUSTER` | ECS cluster name |
| `ECS_SERVICE` | ECS service name |
| `CONTAINER_NAME` | Container name in the task definition |
| `FRONTEND_URL` | Production domain (e.g. `cafe.example.com`) |

The following **AWS Secrets Manager** secrets must also exist (see [Secrets Manager Setup](#secrets-manager-setup) below).

### Automatic Deploy

Push to the `main` branch:

```bash
git push origin main
```

The GitHub Actions workflow (`.github/workflows/deploy-aws.yml`) builds a Docker image, pushes it to ECR, updates the ECS task definition, and deploys to the Fargate Spot service.

### Manual Deploy

Trigger the workflow from the CLI:

```bash
gh workflow run deploy-aws.yml
```

### Infrastructure Overview

| Resource | Details |
| --- | --- |
| **AWS Region** | Set via `AWS_REGION` GitHub secret |
| **ECR Repository** | Set via `ECR_REPOSITORY` GitHub secret |
| **ECS Service** | 1 Fargate Spot task, 1 vCPU, 2 GB RAM |
| **RDS MySQL** | `coffee-shop-db` (endpoint in Secrets Manager) |
| **immudb** | Sidecar container in same task (localhost:3322) |
| **ALB** | HTTPS listener with Origin CA cert, HTTP→HTTPS redirect |
| **SSL** | Cloudflare Origin CA certificate (Full Strict mode) |
| **Secrets** | AWS Secrets Manager (10 secrets, see below) |

### AWS Resources Required

The following AWS resources must exist before deploying. The deployment workflow assumes they are already provisioned.

- **ECR** — Container registry for the Docker image.
- **ECS Cluster + Service** — Runs the Fargate Spot task. The cluster and service must be configured with `FARGATE_SPOT` as the capacity provider (not the default `FARGATE` launch type). The deploy workflow does not specify a launch type — it relies on the service's capacity provider strategy.
- **RDS MySQL** — Managed database. Connection details injected via AWS Secrets Manager.
- **Security Groups** — ECS: port 3000 from ALB SG. RDS: port 3306 from ECS SG only. ALB: ports 80, 443 from anywhere.
- **ALB** — HTTPS listener with Origin CA cert, HTTP→HTTPS redirect.
- **IAM Roles**:
  - `ecsTaskExecutionRole` — ECR pull, CloudWatch Logs, Secrets Manager read, SSM Managed Instance Core.
  - `ecsTaskRole` — Application-level permissions (ECS Exec support).
- **Secrets Manager** — Stores all sensitive config (see [Secrets Manager Setup](#secrets-manager-setup) below).

### SSL / Domain Setup

1. **DNS:** Cloudflare CNAME record points the production domain to the ALB DNS name.
2. **Cloudflare SSL Mode:** Full (Strict) — Cloudflare terminates public TLS and re-encrypts to the origin.
3. **Origin Certificate:** A Cloudflare Origin CA certificate is installed on the ALB HTTPS listener.
4. **HTTP → HTTPS Redirect:** The ALB redirects all HTTP traffic (port 80) to HTTPS (port 443).

This ensures end-to-end encryption: public traffic is encrypted via Cloudflare's edge, and the origin connection between Cloudflare and the ALB is encrypted with the Origin CA certificate.

### Task Definition

The task definition template (`.aws/task-definition.json`) uses placeholders that are replaced at deploy time:

| Placeholder | Replaced with |
| --- | --- |
| `<AWS_ACCOUNT_ID>` | `AWS_ACCOUNT_ID` secret |
| `<AWS_REGION>` | `AWS_REGION` secret |
| `<YOUR_DOMAIN>` | `FRONTEND_URL` secret |

Container environment variables (`NODE_ENV`, `PORT`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_SYNC`, `FRONTEND_URL`) are set directly in the task definition. All sensitive values are injected from AWS Secrets Manager at container startup.

### Secrets Manager Setup

The following secrets must exist in AWS Secrets Manager (same region as ECS). Create them via the AWS Console or CLI:

| Secret Name | Injected As | Description |
| --- | --- | --- |
| `coffee-shop-pos/db-host` | `DB_HOST` | RDS endpoint address |
| `coffee-shop-pos/db-password` | `DB_PASSWORD` | Database password |
| `coffee-shop-pos/jwt-secret` | `JWT_SECRET` | JWT signing key (generate with `openssl rand -base64 48`) |
| `coffee-shop-pos/session-secret` | `SESSION_SECRET` | Express session key (generate with `openssl rand -base64 48`) |
| `coffee-shop-pos/sepay-api-key` | `SEPAY_API_KEY` | Sepay payment API key |
| `coffee-shop-pos/immudb-password` | `IMMUDB_PASSWORD` | immudb admin password |
| `coffee-shop-pos/sepay-account-number` | `SEPAY_ACCOUNT_NUMBER` | Sepay bank account number |
| `coffee-shop-pos/sepay-bank-name` | `SEPAY_BANK_NAME` | Sepay bank name |
| `coffee-shop-pos/admin-username` | `ADMIN_USERNAME` | Admin user username (auto-created on first boot with MANAGER role) |
| `coffee-shop-pos/admin-password` | `ADMIN_PASSWORD` | Admin user password (auto-created on first boot with MANAGER role) |

> **Important:** Secrets Manager appends a random suffix to each secret's ARN (e.g. `jwt-secret-3CMEXn`). The task definition must reference the **full ARN** including this suffix.

Example — create a secret:

```bash
aws secretsmanager create-secret \
  --name coffee-shop-pos/jwt-secret \
  --secret-string "$(openssl rand -base64 48)" \
  --region ap-east-1
```

Then copy the full ARN (with suffix) from the output into `.aws/task-definition.json`.

Do **not** hard-code production secrets in environment files, the task definition, or CI pipelines.


## See Also

- [Environment Variables Reference](./environment-variables.md)
