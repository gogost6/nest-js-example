// dotenv MUST be the very first require() before any other module is loaded.
// Using require() here intentionally so it runs before hoisted ES module imports.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import "reflect-metadata";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix matching the Spring Boot /api prefix
  app.setGlobalPrefix("api");

  // CORS – mirrors Spring Boot SecurityConfig allowed origins
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  });

  // Validation (mirrors @Valid in Spring controllers)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  // Exception filter (mirrors GlobalExceptionHandler)
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = parseInt(process.env.PORT ?? "3000", 10);
  await app.listen(port);
  console.log(`NestJS server running on http://localhost:${port}/api`);
}

bootstrap();
