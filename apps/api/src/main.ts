import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app-config';
import { HttpExceptionFilter } from './common/http-exception.filter';

const config = appConfig();

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(config.apiPrefix);
  app.use(cookieParser());
  app.enableCors({
    origin: config.frontendOrigin,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}

let appPromise: Promise<INestApplication> | undefined;

export async function handler(request: Request, response: Response) {
  appPromise ??= createApp();
  const app = await appPromise;
  return app.getHttpAdapter().getInstance()(request, response);
}

if (!config.runsOnVercel) {
  void createApp().then((app) => app.listen(config.port));
}

export default handler;
