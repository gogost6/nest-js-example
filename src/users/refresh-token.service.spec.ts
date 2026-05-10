import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { RefreshToken } from "./entities/refresh-token.entity";
import { User } from "./entities/user.entity";
import { RefreshTokenService } from "./refresh-token.service";

const mockRepo = () => ({
  delete: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

describe("RefreshTokenService", () => {
  let service: RefreshTokenService;
  let repo: ReturnType<typeof mockRepo>;

  const makeUser = (id = 1, email = "user@test.com") => ({ id, email }) as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    repo = module.get(getRepositoryToken(RefreshToken));
  });

  afterEach(() => jest.clearAllMocks());

  describe("createRefreshToken", () => {
    it("deletes existing tokens for the user before creating a new one", async () => {
      const user = makeUser();
      const rt = {
        token: "some-uuid",
        user,
        expiresAt: new Date(),
        revoked: false,
      } as RefreshToken;
      repo.create.mockReturnValue(rt);
      repo.save.mockResolvedValue(rt);

      await service.createRefreshToken(user);

      expect(repo.delete).toHaveBeenCalledWith({ user: { id: user.id } });
    });

    it("saves token with correct user", async () => {
      const user = makeUser();
      const rt = {
        token: "some-uuid",
        user,
        expiresAt: new Date(),
        revoked: false,
      } as RefreshToken;
      repo.create.mockReturnValue(rt);
      repo.save.mockResolvedValue(rt);

      const result = await service.createRefreshToken(user);

      expect(repo.save).toHaveBeenCalledWith(rt);
      expect(result.user).toBe(user);
    });

    it("sets expiry approximately 7 days from now", async () => {
      const user = makeUser();
      let capturedCreate: any;
      repo.create.mockImplementation((obj: any) => {
        capturedCreate = obj;
        return obj as RefreshToken;
      });
      repo.save.mockImplementation(async (rt: any) => rt as RefreshToken);

      await service.createRefreshToken(user);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);

      // Allow ±1 second tolerance
      const diffMs = Math.abs(
        capturedCreate.expiresAt.getTime() - expectedDate.getTime(),
      );
      expect(diffMs).toBeLessThan(2000);
    });

    it("generates a non-null token value", async () => {
      const user = makeUser();
      repo.create.mockImplementation((obj: any) => obj as RefreshToken);
      repo.save.mockImplementation(async (rt: any) => rt as RefreshToken);

      const result = await service.createRefreshToken(user);

      expect(result.token).toBeTruthy();
    });
  });

  describe("validateRefreshToken", () => {
    it("returns user for a valid token", async () => {
      const user = makeUser();
      const future = new Date();
      future.setDate(future.getDate() + 7);
      repo.findOne.mockResolvedValue({
        token: "valid",
        user,
        revoked: false,
        expiresAt: future,
      } as RefreshToken);

      const result = await service.validateRefreshToken("valid");

      expect(result).toBe(user);
    });

    it("throws NotFoundException for unknown token", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.validateRefreshToken("unknown")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws UnauthorizedException for revoked token", async () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      repo.findOne.mockResolvedValue({
        token: "revoked",
        user: {} as User,
        revoked: true,
        expiresAt: future,
      } as RefreshToken);

      await expect(service.validateRefreshToken("revoked")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("throws UnauthorizedException for expired token", async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      repo.findOne.mockResolvedValue({
        token: "expired",
        user: {} as User,
        revoked: false,
        expiresAt: past,
      } as RefreshToken);

      await expect(service.validateRefreshToken("expired")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("revokeTokensForUser", () => {
    it("deletes tokens for the given user", async () => {
      const user = makeUser(42);
      repo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.revokeTokensForUser(user);

      expect(repo.delete).toHaveBeenCalledWith({ user: { id: 42 } });
    });
  });
});
