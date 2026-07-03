# Repository Guidelines

## Project Overview

**Stack:** NestJS 11 · React 19 · Vite 6 · MySQL 8 · TypeORM 0.3 · TypeScript · JWT auth · Sepay payments · immudb (optional)


## Architecture

```
Browser → React SPA (Vite) → NestJS API (:3000) → MySQL
                                     ↓
                              Sepay Payment API
                                     ↓
                              immudb (immutable audit log, optional)
```

**Monorepo layout:**
- `backend/src/` — NestJS source code
- `frontend/` — React/Vite app
- Root `package.json` — backend build/test scripts
- `frontend/package.json` — frontend build/test scripts

## Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── ThrottlerModule (rate limiting: 10 req/min)
├── TypeOrmModule.forRoot (MySQL)
├── MenuModule ─────────── exports TypeOrmModule
├── MenuItemModule ─────── imports MenuModule, exports TypeOrmModule
├── TableModule ────────── exports TypeOrmModule
├── EmployeeModule ─────── imports UsersModule
├── OrderModule ────────── imports MenuItemModule, UsersModule, TableModule
├── UsersModule ────────── exports UsersService + TypeOrmModule
├── AuthModule ─────────── imports UsersModule, exports AuthService
├── PaymentModule ──────── imports HttpModule, TransactionsModule
└── TransactionsModule ── imports HttpModule, TypeORM(Transaction), ImmudbService, SePayService
```

Modules consumed by `OrderModule` MUST export `TypeOrmModule` so the consuming module can `@InjectRepository()` cross-module entities.

## Key Directories

```
WNC-2026-N01.LT2/
├── backend/
│   └── src/
│       ├── main.ts              — bootstrap, cookie-parser, session, ValidationPipe
│       ├── app.module.ts        — root module, ConfigModule, TypeORM config
│       ├── auth/                — register/login/profile, JWT strategy, guards
│       ├── users/               — User entity, service, DTOs
│       ├── menus/               — Menu entity (DB table: categories), CRUD
│       ├── menu-items/          — MenuItem entity (DB table: products), CRUD
│       ├── tables/              — Table entity, TableStatus enum, CRUD
│       ├── employees/           — Employee entity, CRUD, FK → User
│       ├── orders/              — Order + OrderItem entities, CRUD
│       ├── payments/            — Payment entity, QR generation, Sepay verification
│       └── common/filters/      — AllExceptionsFilter
├── frontend/
│   └── src/
│       ├── pages/               — Login, Register, Dashboard, POS, Menu, MenuItem
│       ├── components/          — UI primitives + domain components
│       ├── hooks/               — useCart, useOrders, useDashboardStats, etc.
│       ├── services/            — api.ts (fetch wrapper), auth, menu, order, etc.
│       ├── styles/              — auth.css, dashboard.css, pos.css
│       ├── i18n/                — English + Vietnamese
│       └── types/               — TypeScript interfaces
├── test/                        — Backend E2E tests (supertest)
├── docs/                        — Project documentation
├── .github/workflows/           — CI, CD, deploy-aws, lighthouse, codeql
├── .aws/task-definition.json    — ECS Fargate task definition
├── Dockerfile                   — 3-stage multi-arch build (node:24)
├── docker-compose.yml           — Dev compose with env vars
├── docker-compose.standalone.yml — Standalone deploy
├── database.sql                 — Reference SQL schema
├── .env.example                 — Environment variable template
└── package.json                 — Backend scripts
```

## Development Commands

```bash
# Backend (from project root)
npm install                    # install dependencies
npm run build                  # nest build → dist/
npm run start:dev              # nest start --watch (port 3000)
npm run start:prod             # node dist/main.js
npm test                       # jest E2E tests

# Frontend
cd frontend
npm install
npm run dev                    # Vite dev server (port 5173)
npm test                       # Vitest unit tests
npm run test:e2e               # Playwright E2E tests
```

## Code Conventions

### Entity pattern

```typescript
@Entity('table_name')  // explicit table name
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;                              // ALWAYS UUID

  @Column({ name: 'snake_case', type: 'varchar', length: 100 })
  camelCaseField: string;                  // camelCase in TS, snake_case in DB

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Relations

```typescript
@ManyToOne(() => TargetEntity, { nullable: false, onDelete: 'CASCADE' })
@JoinColumn({ name: 'snake_case_fk' })
target: TargetEntity;
```

### DTO validation

```typescript
// Create DTO — required fields have validators
export class CreateThingDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @IsOptional() @IsString()
  description?: string;
}

// Update DTO — all fields optional
export class UpdateThingDto {
  @IsOptional() @IsString() @MaxLength(100)
  name?: string;
}
```

### Service pattern

```typescript
@Injectable()
export class ThingService {
  constructor(
    @InjectRepository(Thing)
    private readonly thingRepository: Repository<Thing>,
  ) {}

  async create(dto: CreateThingDto): Promise<Thing> {
    const thing = this.thingRepository.create(dto);
    return this.thingRepository.save(thing);
  }

  async findOne(id: string): Promise<Thing> {
    const thing = await this.thingRepository.findOne({ where: { id } });
    if (!thing) throw new NotFoundException(`Thing with id ${id} not found`);
    return thing;
  }
}
```

### Auth

- Passwords: `argon2id` via `argon2.hash(password, { type: argon2.argon2id })`
- Access token: 15 min. Refresh token: 7 days.
- JWT payload: `{ sub: user.id, username: user.username, role: user.role }`
- Role-based: `@Roles(UserRole.MANAGER)` + `RolesGuard`

## Entity-to-Table Mapping

| Entity | `@Entity()` | SQL Table |
|--------|-------------|-----------|
| `User` | `users` | `users` |
| `Menu` | `categories` | `categories` |
| `MenuItem` | `products` | `products` |
| `Table` | `tables` | `tables` |
| `Order` | `orders` | `orders` |
| `OrderItem` | `order_items` | `order_items` |
| `Employee` | `employees` | `employees` |
| `Payment` | `payment_requests` | `payment_requests` |
| `Transaction` | `transactions` | `transactions` |

**Note:** `Menu` → `categories` and `MenuItem` → `products` is deliberate. SQL schema uses category/product names; API uses menu/menu-item routes.

## Runtime/Tooling

- **Runtime**: Node.js 22+ (Dockerfile: node:24)
- **Package manager**: npm
- **Framework**: NestJS 11 with Express platform
- **ORM**: TypeORM 0.3 with `mysql2` driver
- **Frontend**: React 19, Vite 6, React Router v7
- **TypeScript**: 6.0, strict mode, `node16` module resolution

## Testing

- **Backend**: Jest 29 + supertest, real MySQL required
- **Frontend**: Vitest 4 + testing-library, Playwright for E2E
- **CI**: MySQL 8 service container, Node 22 runners
- **Timeout**: 120s (cloud DB may be slow)

## CI/CD

| Workflow | Trigger | What |
|----------|---------|------|
| `ci.yml` | push/PR to main | Backend test + frontend test + Playwright E2E |
| `cd.yml` | push to main | Docker build → GHCR |
| `deploy-aws.yml` | push to main | Docker build → ECR → ECS deploy |
| `lighthouse.yml` | push/PR to main | Perf/a11y/best-practices audit |
| `codeql.yml` | push/PR to main | Security analysis |

## Deployment

Three methods: source code, Docker Compose, AWS ECS Fargate. See [docs/deployment.md](docs/deployment.md).

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](docs/README.md) | Documentation index |
| [docs/architecture.md](docs/architecture.md) | System architecture with Mermaid diagrams |
| [docs/getting-started.md](docs/getting-started.md) | Developer onboarding |
| [docs/api-reference.md](docs/api-reference.md) | REST API endpoints |
| [docs/database.md](docs/database.md) | Schema, tables, relationships |
| [docs/environment-variables.md](docs/environment-variables.md) | All config vars |
| [docs/deployment.md](docs/deployment.md) | Three deploy methods |
| [docs/ci-cd.md](docs/ci-cd.md) | GitHub Actions workflows |
| [docs/runbook.md](docs/runbook.md) | Operational troubleshooting |
