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
| `SESSION_SECRET` | Yes | — | Secret used to sign Express session cookies |
| `PORT` | No | `3000` | Port the backend server listens on |
| `SEPAY_API_KEY` | No | — | Sepay payment gateway API key |
| `SEPAY_ACCOUNT_NUMBER` | No | — | Bank account number for Sepay transfers |
| `SEPAY_BANK_NAME` | No | — | Bank name for Sepay transfers |

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
| `coffee-shop-pos/session-secret` | `SESSION_SECRET` | Express session key |
| `coffee-shop-pos/sepay-api-key` | `SEPAY_API_KEY` | Sepay payment API key |
| `coffee-shop-pos/sepay-account-number` | `SEPAY_ACCOUNT_NUMBER` | Sepay bank account number |
| `coffee-shop-pos/sepay-bank-name` | `SEPAY_BANK_NAME` | Sepay bank name |

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
SESSION_SECRET=test-session-secret-change-me
PORT=3000

SEPAY_API_KEY=your_sepay_api_key
SEPAY_ACCOUNT_NUMBER=3669420000
SEPAY_BANK_NAME=MBBank

# Frontend (Vite dev server)
VITE_PORT=5173
VITE_API_BASE_URL=http://localhost:3000
```
