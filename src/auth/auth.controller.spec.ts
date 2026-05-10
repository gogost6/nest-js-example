import {
  INestApplication,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { GlobalExceptionFilter } from "../common/filters/global-exception.filter";
import { RefreshToken } from "../users/entities/refresh-token.entity";
import { User } from "../users/entities/user.entity";
import { RefreshTokenService } from "../users/refresh-token.service";
import { UsersService } from "../users/users.service";
import { AuthController } from "./auth.controller";
import { JwtTokenService } from "./jwt-token.service";

const mockUsersService = {
  register: jest.fn(),
  login: jest.fn(),
  findByEmail: jest.fn(),
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
  addRole: jest.fn(),
};

const mockRefreshTokenService = {
  validateRefreshToken: jest.fn(),
  createRefreshToken: jest.fn(),
  revokeTokensForUser: jest.fn(),
};

const mockJwtTokenService = {
  generateToken: jest.fn(),
};

describe("AuthController", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: JwtTokenService, useValue: mockJwtTokenService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/refresh", () => {
    it("with valid token returns new access token", async () => {
      const user = { id: 1, email: "user@mail.com" } as User;
      const newRt = { token: "new-refresh-token" } as RefreshToken;
      mockRefreshTokenService.validateRefreshToken.mockResolvedValue(user);
      mockJwtTokenService.generateToken.mockReturnValue("new-access-token");
      mockRefreshTokenService.createRefreshToken.mockResolvedValue(newRt);

      const res = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "valid-token" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe("new-access-token");
    });

    it("with valid token returns new refresh token", async () => {
      const user = { id: 1, email: "user@mail.com" } as User;
      const newRt = { token: "new-refresh-token" } as RefreshToken;
      mockRefreshTokenService.validateRefreshToken.mockResolvedValue(user);
      mockJwtTokenService.generateToken.mockReturnValue("new-access-token");
      mockRefreshTokenService.createRefreshToken.mockResolvedValue(newRt);

      const res = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "valid-token" });

      expect(res.status).toBe(200);
      expect(res.body.refreshToken).toBe("new-refresh-token");
    });

    it("with unknown token returns 404", async () => {
      mockRefreshTokenService.validateRefreshToken.mockRejectedValue(
        new NotFoundException("Refresh token not found"),
      );

      const res = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "unknown-token" });

      expect(res.status).toBe(404);
    });

    it("with expired token returns 401", async () => {
      mockRefreshTokenService.validateRefreshToken.mockRejectedValue(
        new UnauthorizedException("Refresh token has expired"),
      );

      const res = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "expired-token" });

      expect(res.status).toBe(401);
    });

    it("with revoked token returns 401", async () => {
      mockRefreshTokenService.validateRefreshToken.mockRejectedValue(
        new UnauthorizedException("Refresh token has been revoked"),
      );

      const res = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "revoked-token" });

      expect(res.status).toBe(401);
    });

    it("with blank token returns 400", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/refresh")
        .send({ refreshToken: "" });

      expect(res.status).toBe(400);
    });
  });
});
