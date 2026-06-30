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
  await app.init();
  const publicPath = join(__dirname, '..', 'public');
  if (existsSync(publicPath)) {
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.use(express.static(publicPath));
    // SPA fallback: non-file GET requests that hit no API route → index.html
    httpAdapter.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.method === 'GET' && !req.path.includes('.')) {
        res.sendFile(join(publicPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();