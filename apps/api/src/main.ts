import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env';

validateEnvironment();

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

let appPromise: Promise<INestApplication> | undefined;

export async function handler(request: Request, response: Response) {
  appPromise ??= createApp();
  const app = await appPromise;
  return app.getHttpAdapter().getInstance()(request, response);
}

if (process.env.VERCEL !== '1') {
  void createApp().then((app) => app.listen(process.env.PORT ?? 3001));
}

export default handler;
