# Environment Variables Reference

This document covers all environment variables used by the NestJS backend and React/Vite frontend. The canonical source of defaults is `WNC-2026-N01.LT2/.env.example`.

---

## Backend (NestJS)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_USERNAME` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | — | MySQL password |
| `DB_DATABASE` | Yes | `Quan_Ly_Quan_Cafe` | Database name |
| `DB_SYNC` | Yes | `true` | Auto-sync TypeORM schema on startup |
| `DB_SSL_CA` | No | — | Path to CA certificate for SSL connections (production) |
| `NODE_ENV` | Yes | `development` | Runtime environment (`development` / `production`) |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed CORS origin — must match the actual frontend domain |
| `JWT_SECRET` | Yes | — | Secret used to sign and verify JSON Web Tokens |
| `JWT_ACCESS_EXPIRES` | No | `15m` | Access token lifetime (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES` | No | `7d` | Refresh token lifetime (e.g. `7d`, `30d`) |
| `JWT_REMEMBER_ME_EXPIRES` | No | `30d` | Remember-me token lifetime (e.g. `30d`, `90d`) |
| `SESSION_SECRET` | Yes | — | Secret used to sign Express session cookies |
| `PORT` | No | `3000` | Port the backend server listens on |
| `SEPAY_API_KEY` | No | — | Sepay payment gateway API key |
| `SEPAY_ACCOUNT_NUMBER` | No | `3669420000` | Bank account number for Sepay transfers |
| `SEPAY_BANK_NAME` | No | `MBBank` | Bank name for Sepay transfers |
| `INIT_DB_SEED` | No | `false` | Seed database on first boot |
| `IMMUDB_HOST` | No | — | immudb host (set to `localhost` for Docker Compose / sidecar) |
| `IMMUDB_PORT` | No | `3322` | immudb gRPC port |
| `IMMUDB_USER` | No | `immudb` | immudb username |
| `IMMUDB_PASSWORD` | No | `immudb` | immudb password |
| `IMMUDB_DATABASE` | No | `defaultdb` | immudb database name |
| `ADMIN_USERNAME` | No | — | Username for the admin (MANAGER) user. On first boot, if no admin user exists in the database, one is auto-created using this username and `ADMIN_PASSWORD`. |
| `ADMIN_PASSWORD` | No | — | Password for the admin (MANAGER) user. On first boot, if no admin user exists in the database, one is auto-created using `ADMIN_USERNAME` and this password. |

## Frontend (Vite)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_PORT` | No | `5173` | Port for the Vite dev server |
| `VITE_API_BASE_URL` | No | `http://localhost:3000` | Backend API base URL used by the frontend |

---

## Production Guidelines

### Secrets

- **`JWT_SECRET`** and **`SESSION_SECRET`** MUST be replaced with strong, unique, randomly generated values in production. Never ship the defaults.
- **`SEPAY_API_KEY`** should also be treated as a secret.

### Database

- **`DB_SYNC`** MUST be set to `false` in production. Automatic schema synchronization can cause data loss on schema changes. Use migrations instead.
- **`DB_SSL_CA`** is required when connecting to an RDS instance with SSL enabled (the default for AWS RDS).

### CORS

- **`FRONTEND_URL`** MUST be set to the exact production domain (e.g., `https://<YOUR_DOMAIN>`). Mismatches will cause CORS errors.

### AWS Secrets Manager

On ECS Fargate, sensitive values are injected from AWS Secrets Manager at container startup. The task definition (`.aws/task-definition.json`) references these secrets:

| Secret Name | Injected As | Description |
| --- | --- | --- |
| `coffee-shop-pos/db-host` | `DB_HOST` | RDS endpoint address |
| `coffee-shop-pos/db-password` | `DB_PASSWORD` | Database password |
| `coffee-shop-pos/jwt-secret` | `JWT_SECRET` | JWT signing key |
| `coffee-shop-pos/immudb-password` | `IMMUDB_PASSWORD` | immudb admin password |
| `coffee-shop-pos/session-secret` | `SESSION_SECRET` | Express session key |
| `coffee-shop-pos/sepay-api-key` | `SEPAY_API_KEY` | Sepay payment API key |
| `coffee-shop-pos/sepay-account-number` | `SEPAY_ACCOUNT_NUMBER` | Sepay bank account number |
| `coffee-shop-pos/sepay-bank-name` | `SEPAY_BANK_NAME` | Sepay bank name |
| `coffee-shop-pos/admin-username` | `ADMIN_USERNAME` | Admin user username (MANAGER role, auto-created on first boot) |
| `coffee-shop-pos/admin-password` | `ADMIN_PASSWORD` | Admin user password (MANAGER role, auto-created on first boot) |

Other environment variables (`NODE_ENV`, `PORT`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_SYNC`, `FRONTEND_URL`) are set directly in the task definition as plain environment variables.

Do **not** hard-code production secrets in environment files or CI pipelines.


---

## Example (`.env` for local development)

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=Quan_Ly_Quan_Cafe
DB_SYNC=true

NODE_ENV=development
FRONTEND_URL=http://localhost:5173

JWT_SECRET=test-jwt-secret-change-me
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
JWT_REMEMBER_ME_EXPIRES=30d
SESSION_SECRET=test-session-secret-change-me
PORT=3000

SEPAY_API_KEY=your_sepay_api_key
SEPAY_ACCOUNT_NUMBER=3669420000
SEPAY_BANK_NAME=MBBank

INIT_DB_SEED=false

ADMIN_USERNAME=admin
ADMIN_PASSWORD=Change-me-in-production

# Immudb (immutable audit log — optional)
IMMUDB_HOST=localhost
IMMUDB_PORT=3322
IMMUDB_USER=immudb
IMMUDB_PASSWORD=immudb
IMMUDB_DATABASE=defaultdb

# Frontend (Vite dev server)
VITE_PORT=5173
VITE_API_BASE_URL=http://localhost:3000
```
