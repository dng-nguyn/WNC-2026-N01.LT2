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

### Volumes

- `mysql_data` — persists MySQL data across container restarts.

### Key Details

- `DB_HOST` for the app container is `db` (Docker service DNS). Do not change this.
- The MySQL port is not exposed to the host by default. To access it for development, uncomment the `ports` mapping under the `db` service in `docker-compose.yml`.
- The app waits for the database healthcheck to pass before starting (`depends_on` with `condition: service_healthy`).
- Set `INIT_DB_SEED=true` on the first run if you want to seed the database with sample data.

---

## 3. AWS (ECS Fargate + RDS)

Production deployment on AWS using ECS Fargate for compute and RDS MySQL for the database. Automated via GitHub Actions — every push to `main` triggers a deploy.

### Prerequisites

- GitHub repository with the following **Repository Secrets** configured:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
- The following AWS resources provisioned (see [AWS Resources](#aws-resources-required) below).

### Automatic Deploy

Push to the `main` branch:

```bash
git push origin main
```

The GitHub Actions workflow (`.github/workflows/deploy-aws.yml`) builds a Docker image, pushes it to ECR, updates the ECS task definition, and deploys to the Fargate service.

### Manual Deploy

Trigger the workflow from the CLI:

```bash
gh workflow run deploy-aws.yml
```

### Infrastructure Overview

| Resource | Details |
| --- | --- |
| **AWS Region** | Configured in `deploy-aws.yml` (`env.AWS_REGION`) |
| **ECR Repository** | `coffee-shop-pos` |
| **ECS Cluster** | `coffee-shop-pos` |
| **ECS Service** | `coffee-shop-pos` (1 Fargate task, 1 vCPU, 2 GB RAM) |
| **RDS MySQL** | `coffee-shop-db` (endpoint in Secrets Manager) |
| **ALB** | Created during infra setup (DNS in AWS console) |
| **SSL** | Cloudflare Origin CA certificate |

### AWS Resources Required

The following AWS resources must exist before deploying. The deployment workflow assumes they are already provisioned.

- **ECR** — Container registry for the Docker image.
- **ECS Cluster + Service** — Runs the Fargate task. Task definition is at `.aws/task-definition.json`.
- **RDS MySQL** — Managed database. Connection details injected via AWS Secrets Manager (`db-host`, `db-password`).
- **Security Groups** — ECS: ports 80, 443, 3000. RDS: port 3306 from ECS SG only.
- **ALB** — HTTPS listener with Origin CA cert, HTTP→HTTPS redirect.
- **IAM** — `ecsTaskExecutionRole` with ECR pull, CloudWatch Logs, Secrets Manager read.
- **Secrets Manager** — Stores `db-host` and `db-password`.
- **CloudWatch** — Log group `/ecs/coffee-shop-pos`.

The production domain is configured as follows:

1. **DNS:** Cloudflare DNS record (CNAME) points `<YOUR_DOMAIN>` to the ALB DNS name.
2. **Cloudflare SSL Mode:** Full (Strict) — Cloudflare terminates the public TLS connection and re-encrypts to the origin.
3. **Origin Certificate:** A Cloudflare Origin CA certificate is installed on the ALB's HTTPS listener. This certificate expires in 2041.
4. **HTTP → HTTPS Redirect:** The ALB redirects all HTTP traffic (port 80) to HTTPS (port 443).

This setup ensures end-to-end encryption: public traffic is encrypted via Cloudflare's edge, and the origin connection between Cloudflare and the ALB is encrypted with the Origin CA certificate.

---

## See Also

- [Environment Variables Reference](./environment-variables.md)
