# Getting Started

Developer onboarding guide for the Coffee Shop POS/Management System.

## Prerequisites

- **Node.js** 22 or later
- **npm** (bundled with Node.js)
- **MySQL** 8 or later
- **Git**

Verify your installations:

```bash
node --version   # v22.x.x or higher
npm --version
mysql --version  # 8.x or higher
git --version
```

## Clone and Setup

```bash
git clone <repo-url>
cd WNC-2026-N01.LT2
```

## Backend Setup

The backend is a NestJS application. The `package.json` and all build scripts live at the project root.

```bash
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run start:dev
```

The backend runs on **http://localhost:3000**.

Swagger API documentation is available at **http://localhost:3000/api/docs**.

## Frontend Setup

The frontend is a React + Vite application located in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:5173**.

## Environment Variables

Copy `.env.example` to `.env` at the project root and configure:

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `your_mysql_password` |
| `DB_DATABASE` | Database name | `Quan_Ly_Quan_Cafe` |
| `DB_SYNC` | Auto-sync schema (dev only) | `true` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret | `your_jwt_secret` |
| `SESSION_SECRET` | Session signing secret | `your_session_secret` |
| `PORT` | Backend server port | `3000` |
| `SEPAY_API_KEY` | Sepay API key for QR payments | `your_sepay_api_key` |
| `SEPAY_ACCOUNT_NUMBER` | Sepay account number | `3669420000` |
| `SEPAY_BANK_NAME` | Sepay bank name | `MBBank` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `VITE_PORT` | Vite dev server port | `5173` |
| `VITE_API_BASE_URL` | API base URL for frontend | `http://localhost:3000` |

For full details, see [environment-variables.md](./environment-variables.md).

## Running Tests

```bash
# Backend tests (requires a running MySQL instance, run from project root)
npm test

# Frontend tests
cd frontend
npm test
```

## Project Structure

```
WNC-2026-N01.LT2/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── auth/               # Authentication (JWT, guards, strategies)
│   │   ├── users/              # User entity and service
│   │   ├── menus/              # Menu (categories) CRUD
│   │   ├── menu-items/         # Menu items (products) CRUD
│   │   ├── tables/             # Table management
│   │   ├── employees/          # Employee CRUD, FK → User
│   │   ├── orders/             # Order + OrderItem management
│   │   ├── payments/           # Payment (QR, Sepay verification)
│   │   ├── common/             # Shared filters, interceptors
│   │   ├── main.ts             # Entry point
│   │   └── app.module.ts       # Root module
│   ├── test/                   # Backend test files
│   ├── docs/                   # Backend-specific documentation
│   └── database.sql            # Reference SQL schema
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/              # Route pages
│   │   ├── components/         # Reusable components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service layer
│   │   ├── styles/             # CSS files
│   │   ├── i18n/               # Internationalization (en, vi)
│   │   └── types/              # TypeScript types
│   └── public/                 # Static assets
├── docs/                       # Project documentation
├── .github/workflows/          # CI/CD pipelines
├── .aws/                       # AWS task definition
├── scripts/                    # Utility scripts (healthcheck, seed)
├── Dockerfile                  # Multi-stage build
├── docker-compose.yml          # Local Docker setup
├── .env.example                # Environment variable template
└── package.json                # Root package.json
```

## Docker Setup (Optional)

You can run the entire stack with Docker Compose:

```bash
docker-compose up
```

Or for a standalone backend build:

```bash
docker-compose -f docker-compose.standalone.yml up
```
