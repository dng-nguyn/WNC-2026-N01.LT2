# Repository Guidelines

## Project Overview

NestJS backend for a coffee shop management system. MySQL-backed REST API with JWT authentication, 6 domain modules (menus, menu-items, tables, employees, orders, users), and full CRUD with relational data. TypeORM with `synchronize: true` for dev schema management.

## Architecture & Data Flow

```
HTTP Request → Global Pipes (ValidationPipe) → Controller → Service → TypeORM Repository → MySQL
                    ↑                                                              |
              class-validator DTOs                                          Entities map to
              (whitelist + transform)                                       SQL tables
```

- **NestJS** with CommonJS modules (`"type": "commonjs"` in package.json)
- **TypeORM** with `autoLoadEntities: true`, repositories injected via `@InjectRepository()`
- **JWT auth** via `@nestjs/jwt` + `passport-jwt`, passwords hashed with `argon2id`
- **Validation** via `class-validator` + `class-transformer` DTOs, global `ValidationPipe` with `whitelist: true, transform: true`
- **Session** via `express-session` with memory store

### Module dependency graph

```
AppModule
├── ConfigModule (global)
├── TypeOrmModule.forRoot (MySQL)
├── MenuModule ─────────── exports TypeOrmModule
├── MenuItemModule ─────── imports MenuModule, exports TypeOrmModule
├── TableModule ────────── exports TypeOrmModule
├── EmployeeModule
├── OrderModule ────────── imports MenuItemModule, UsersModule, TableModule
├── UsersModule ────────── exports UsersService + TypeOrmModule
└── AuthModule ─────────── imports UsersModule, exports AuthService
```

Modules that are consumed by `OrderModule` MUST export `TypeOrmModule` so the consuming module can `@InjectRepository()` cross-module entities.

## Key Directories

```
src/
  main.ts              — bootstrap, cookie-parser, session, ValidationPipe, PORT env
  app.module.ts        — root module, ConfigModule, TypeORM config, all feature modules
  auth/                — register/login/profile, JWT strategy, guards
  users/               — User entity, service, DTOs, module
  menus/               — Menu entity (DB table: categories), CRUD
  menu-items/          — MenuItem entity (DB table: products), FK → Menu, CRUD
  tables/              — Table entity, TableStatus enum, CRUD
  employees/           — Employee entity, CRUD
  orders/              — Order + OrderItem entities, relational CRUD, addItem
test/
  app.e2e-spec.ts      — 45 E2E tests via supertest
docs/                  — Mermaid activity diagrams per module
database.sql           — Reference SQL schema (7 tables)
.env.example           — Required environment variables
jest.config.js         — ts-jest + dotenv preload
.github/workflows/ci.yml  — CI with MySQL 8 service container
```

## Development Commands

```bash
npm install              # install dependencies
npm run build            # nest build (TypeScript compile to dist/)
npm run start:dev        # nest start --watch (port 3000)
npm run start:prod       # node dist/main.js
npm test                 # jest --forceExit --detectOpenHandles (45 E2E tests)
```

## Code Conventions & Common Patterns

### Entity definition (canonical)

```typescript
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('table_name')  // explicit table name to avoid class-name collisions
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;                              // ALWAYS UUID string

  @Column({ name: 'snake_case', type: 'varchar', length: 100 })
  camelCaseField: string;                  // camelCase in TS, snake_case in DB via `name`

  @Column({ nullable: true, type: 'varchar' })
  optionalField: string | null;            // nullable = explicit `| null`

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;                           // decimal for currency

  @Column({ type: 'enum', enum: SomeEnum, default: SomeEnum.DEFAULT })
  status: SomeEnum;                        // enum with import from separate file

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;                         // always named column

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;                         // only on entities with update semantics
}
```

### Relations

```typescript
@ManyToOne(() => TargetEntity, { nullable: false, onDelete: 'CASCADE' })
@JoinColumn({ name: 'snake_case_fk' })
target: TargetEntity;

@OneToMany(() => ChildEntity, (child) => child.parent, { cascade: true })
children: ChildEntity[];
```

### DTO validation pattern

```typescript
// Create DTO — required fields have validators
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateThingDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @IsOptional() @IsString()
  description?: string;
}

// Update DTO — all fields optional (Partial pattern)
export class UpdateThingDto {
  @IsOptional() @IsString() @MaxLength(100)
  name?: string;

  @IsOptional() @IsString()
  description?: string;
}
```

- Use `@Type(() => Number)` from `class-transformer` for numeric fields in DTOs
- Use `@ValidateNested({ each: true })` + `@Type(() => NestedDto)` for nested arrays
- Use `@ArrayMinSize(1)` to reject empty arrays
- Use `@IsUUID()` for relational ID fields
- Use `@IsEnum(EnumType)` for enum fields

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

  async findAll(): Promise<Thing[]> {
    return this.thingRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Thing> {
    const thing = await this.thingRepository.findOne({ where: { id } });
    if (!thing) throw new NotFoundException(`Thing with id ${id} not found`);
    return thing;
  }

  async update(id: string, dto: UpdateThingDto): Promise<Thing> {
    const thing = await this.findOne(id);
    Object.assign(thing, dto);
    return this.thingRepository.save(thing);
  }

  async remove(id: string): Promise<void> {
    const thing = await this.findOne(id);
    await this.thingRepository.remove(thing);
  }
}
```

- FK resolution in `create`/`update`: fetch related entity via its repository, throw `NotFoundException` if missing, assign
- Price capture in orders: read `menuItem.price` at order time, store in `OrderItem.price`

### Controller pattern

```typescript
@Controller('things')          // plural, kebab-case route
export class ThingController {
  constructor(private readonly thingService: ThingService) {}

  @Post()                      create(@Body() dto: CreateThingDto): Promise<Thing>
  @Get()                       findAll(): Promise<Thing[]>
  @Get(':id')                  findOne(@Param('id') id: string): Promise<Thing>
  @Patch(':id')                update(@Param('id') id: string, @Body() dto: UpdateThingDto): Promise<Thing>
  @Delete(':id')               remove(@Param('id') id: string): Promise<void>
}
```

- No `ParseIntPipe` — all IDs are UUID strings
- No `@UseGuards(JwtAuthGuard)` on CRUD endpoints (auth not required for these)

### Module pattern

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Thing])],
  controllers: [ThingController],
  providers: [ThingService],
  exports: [TypeOrmModule],   // ONLY if another module needs @InjectRepository(Thing)
})
export class ThingModule {}
```

### Enums

- Separate file per enum: `src/<module>/<name>.enum.ts`
- UPPERCASE values: `PENDING = 'PENDING'`
- Default values set in entity `@Column` decorator

### Auth patterns

- Passwords hashed with `argon2id` via `argon2.hash(password, { type: argon2.argon2id })`
- JWT issued with `{ sub: user.id, username: user.username }` (1-day expiry)
- `JwtStrategy` reads `JWT_SECRET` from `ConfigService` with fallback `'default-secret-change-me'`
- `JwtAuthGuard` extends `AuthGuard('jwt')` — apply with `@UseGuards(JwtAuthGuard)`

## Important Files

| File | Role |
|---|---|
| `src/main.ts` | Entry point. `import 'dotenv/config'` MUST be second import (after `reflect-metadata`). Global pipes, cookie-parser, session. |
| `src/app.module.ts` | Root module. TypeORM config reads `process.env.*` directly (not ConfigService). SSL enabled for cloud MySQL. |
| `src/auth/auth.service.ts` | `register()` creates user via `UsersService`, signs JWT. `login()` verifies password, signs JWT. |
| `src/auth/strategies/jwt.strategy.ts` | Validates JWT payload. `sub: string` (UUID). |
| `src/orders/orders.service.ts` | Most complex service. Multi-repository injection. `create()` fetches User, Table, MenuItem; captures prices; computes `totalAmount`. `addItem()` appends item and recalculates. |
| `test/app.e2e-spec.ts` | E2E test suite. Bootstraps AppModule via `Test.createTestingModule`. Uses `supertest` for HTTP. 45 tests in ordered describe blocks. |
| `jest.config.js` | `require('dotenv').config()` at top (loaded BEFORE any test file). ts-jest with decorator metadata enabled. 120s timeout. |
| `.github/workflows/ci.yml` | MySQL 8 service container. Runs `npm ci` → `npm run build` → `npm test`. Env vars set via `env:` block. |
| `database.sql` | Reference SQL schema. Note: `categories` table = `Menu` entity, `products` table = `MenuItem` entity. |
| `.env.example` | Template for required env vars. `.env` is gitignored. |

## Runtime/Tooling Preferences

- **Runtime**: Node.js 22+ (target ES2022)
- **Package manager**: npm
- **Framework**: NestJS 11 with Express platform
- **ORM**: TypeORM 0.3 with `mysql2` driver
- **Auth**: `@nestjs/jwt` + `passport-jwt` + `argon2`
- **Validation**: `class-validator` 0.15 + `class-transformer` 0.5
- **TypeScript**: 5.8, strict mode, `commonjs` modules
- **Build**: `@nestjs/cli` (`nest build`)
- **Environment**: `dotenv` loaded at entry point (NOT only via ConfigModule)

## Testing & QA

- **Framework**: Jest 29+ with ts-jest
- **HTTP testing**: supertest against `app.getHttpServer()`
- **Database**: Real MySQL required (no mocking). CI provides MySQL 8 service container.
- **Test command**: `npm test`
- **Timeout**: 120s (cloud MySQL may be slow)
- **Test structure**:
  - Single `beforeAll` bootstraps `Test.createTestingModule({ imports: [AppModule] })`
  - `describe` blocks per module, ordered: Auth → Menus → MenuItems → Tables → Orders → Edge cases
  - Variables (`token`, `userId`, `menuId`, etc.) shared across tests via closure
  - Each test creates unique data using `Date.now()` suffixes
  - Tests cascade: register user → get token → use token in subsequent auth tests
  - `afterAll` calls `app.close()`
- **Env vars for tests**: `JWT_SECRET`, `SESSION_SECRET`, `DB_*`, `NODE_ENV=test`

## Entity-to-Table Mapping

| Entity Class | `@Entity()` | SQL Table |
|---|---|---|
| `User` | `users` | `users` |
| `Menu` | `categories` | `categories` |
| `MenuItem` | `products` | `products` |
| `Table` | `tables` | `tables` |
| `Order` | `orders` | `orders` |
| `OrderItem` | `order_items` | `order_items` |
| `Employee` | `employees` | `employees` |

Note the deliberate mismatch: `Menu` maps to `categories` table and `MenuItem` maps to `products` table. This is because the SQL schema uses those names but the NestJS API uses `menus`/`menu-items` routes.
