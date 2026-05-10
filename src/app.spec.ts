/**
 * Smoke test — mirrors DemoApplicationTests.java.
 * Verifies the application context loads successfully.
 *
 * Requires a running PostgreSQL instance with Flyway migrations applied.
 * Set DB_* and JWT_SECRET env vars before running, or use a .env file.
 */
// Load .env before any module imports so JWT_SECRET and DB_* are available
require("dotenv").config({ path: `${process.cwd()}/.env` });

import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "./app.module";

describe("AppModule (smoke test)", () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it("context loads", () => {
    expect(moduleRef).toBeDefined();
  });
});
