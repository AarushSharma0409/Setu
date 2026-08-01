import "reflect-metadata";

import type { Server } from "node:http";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { AppModule } from "./app/app.module";
import { EnvService } from "./common/env/env.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvService);

  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json({ limit: env.values.JSON_BODY_LIMIT }));
  app.use(express.urlencoded({
    extended: true,
    limit: env.values.JSON_BODY_LIMIT,
  }));
  app.enableCors({
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Request-Id"],
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: env.values.CORS_ALLOWED_ORIGINS,
  });
  const server = app.getHttpServer() as Server;
  server.requestTimeout = env.values.REQUEST_TIMEOUT_MS;
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(env.values.API_PORT);
  Logger.log(
    `Setu API listening on http://localhost:${env.values.API_PORT}/api/v1`,
    "Bootstrap",
  );
}

void bootstrap();
