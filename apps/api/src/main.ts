import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app/app.module";
import { EnvService } from "./common/env/env.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const env = app.get(EnvService);

  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: env.values.CORS_ALLOWED_ORIGINS,
  });
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
