import 'reflect-metadata';
import 'dotenv/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import * as argon2 from 'argon2';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';
import { UserRole } from './users/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger / OpenAPI docs
  const config = new DocumentBuilder()
    .setTitle('Coffee Shop API')
    .setDescription('NestJS backend for coffee shop management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS for frontend access (comma-separated origins supported)
  const origins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global serializer interceptor
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Cookie parser middleware
  app.use(cookieParser());

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'session-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Serve frontend static files (single-image deployment)
  const publicPath = join(__dirname, '..', 'public');
  if (existsSync(publicPath)) {
    app.use(express.static(publicPath));

    // SPA catch-all: serve index.html for browser navigations to frontend routes.
    // Browsers send Accept: text/html; API clients (fetch/axios) send Accept: application/json.
    // Registered via app.use() BEFORE app.init() so it runs before NestJS controllers.
    app.use((req: any, res: any, next: any) => {
      if (req.method !== 'GET') return next();
      if (req.path.startsWith('/api')) return next();
      if (req.path === '/health') return next();
      if (req.path.includes('.')) return next();
      const accept = req.headers.accept ?? '';
      if (accept.includes('text/html')) {
        return res.sendFile(join(publicPath, 'index.html'));
      }
      next();
    });
  }

  await app.init();

  await app.listen(process.env.PORT ?? 3000);

  // Auto-seed on first boot if INIT_DB_SEED=true
  if (process.env.INIT_DB_SEED === 'true') {
    const { spawn } = await import('child_process');
    const port = process.env.PORT ?? 3000;
    const seed = spawn('node', ['scripts/seed.mjs'], {
      env: { ...process.env, SEED_API_URL: `http://127.0.0.1:${port}` },
      stdio: 'inherit',
    });
    seed.on('exit', (code) => {
      if (code !== 0) console.warn(`Seed exited with code ${code} (items may already exist)`);
    });
  }

  // Auto-create admin user from env vars if no MANAGER exists
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminUsername && adminPassword) {
    try {
      const usersService = app.select(UsersModule).get(UsersService);
      const allUsers = await usersService.findAll();
      const hasManager = allUsers.some((u) => u.role === UserRole.MANAGER);

      if (!hasManager) {
        const hashedPassword = await argon2.hash(adminPassword, {
          type: argon2.argon2id,
        });
        await usersService.create({
          username: adminUsername,
          password: hashedPassword,
          fullName: adminUsername,
          role: UserRole.MANAGER,
        });
        console.log('Admin user created with MANAGER role');
      } else {
        console.log('Admin auto-create skipped — MANAGER user exists');
      }
    } catch (err) {
      console.error('Admin auto-create failed:', err instanceof Error ? err.message : 'unknown');
    }
  }
}

bootstrap();
