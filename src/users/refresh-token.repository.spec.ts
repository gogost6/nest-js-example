/**
 * Integration tests for the RefreshToken TypeORM repository.
 * Mirrors RefreshTokenRepositoryTest.java (@DataJpaTest with NONE replacement).
 *
 * Requires a running PostgreSQL instance with Flyway migrations applied.
 * Connection config is read from environment variables (see .env).
 */
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Comment } from "../comments/entities/comment.entity";
import { Post } from "../posts/entities/post.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { Role } from "./entities/role.enum";
import { UserRole } from "./entities/user-role.entity";
import { User } from "./entities/user.entity";
import { RefreshTokenSubscriber } from "./subscribers/refresh-token.subscriber";
import { UserSubscriber } from "./subscribers/user.subscriber";

const DB_CONFIG = {
  type: "postgres" as const,
  host: process.env.DB_HOST ?? "localhost",
  port: parseInt(process.env.DB_PORT ?? "5432", 10),
  database: process.env.DB_NAME ?? "myappdb",
  username: process.env.DB_USER ?? "myuser",
  password: process.env.DB_PASSWORD ?? "mypassword",
  entities: [User, UserRole, RefreshToken, Post, Comment],
  synchronize: false,
};

describe("RefreshTokenRepository (integration)", () => {
  let module: TestingModule;
  let refreshTokenRepo: Repository<RefreshToken>;
  let userRepo: Repository<User>;
  let postRepo: Repository<Post>;
  let commentRepo: Repository<Comment>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(DB_CONFIG),
        TypeOrmModule.forFeature([User, UserRole, RefreshToken, Post, Comment]),
      ],
      providers: [UserSubscriber, RefreshTokenSubscriber],
    }).compile();

    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
    userRepo = module.get(getRepositoryToken(User));
    postRepo = module.get(getRepositoryToken(Post));
    commentRepo = module.get(getRepositoryToken(Comment));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await refreshTokenRepo.query(
      "TRUNCATE TABLE comment, posts, refresh_tokens, user_roles, users CASCADE",
    );
  });

  const savedUser = async (): Promise<User> => {
    const user = userRepo.create({
      email: `user${Date.now()}@mail.com`,
      password: "hashed",
      userRoles: [],
    });
    const saved = await userRepo.save(user);
    await userRepo.query(
      "INSERT INTO user_roles (user_id, roles) VALUES ($1, $2)",
      [saved.id, Role.USER],
    );
    return saved;
  };

  const savedToken = async (
    user: User,
    tokenValue: string,
  ): Promise<RefreshToken> => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const rt = refreshTokenRepo.create({
      token: tokenValue,
      user,
      expiresAt,
      revoked: false,
    });
    return refreshTokenRepo.save(rt);
  };

  it("findByToken when exists returns the token", async () => {
    const user = await savedUser();
    await savedToken(user, "my-token");

    const result = await refreshTokenRepo.findOne({
      where: { token: "my-token" },
      relations: ["user"],
    });

    expect(result).not.toBeNull();
    expect(result!.token).toBe("my-token");
  });

  it("findByToken when not exists returns null", async () => {
    const result = await refreshTokenRepo.findOne({
      where: { token: "nonexistent" },
    });

    expect(result).toBeNull();
  });

  it("deleteByUser removes only that user's tokens", async () => {
    const user1 = await savedUser();
    const user2 = await savedUser();
    await savedToken(user1, "token-user1");
    await savedToken(user2, "token-user2");

    await refreshTokenRepo.delete({ user: { id: user1.id } });

    const rt1 = await refreshTokenRepo.findOne({
      where: { token: "token-user1" },
    });
    const rt2 = await refreshTokenRepo.findOne({
      where: { token: "token-user2" },
    });

    expect(rt1).toBeNull();
    expect(rt2).not.toBeNull();
  });

  it("save persists token with user", async () => {
    const user = await savedUser();
    const saved = await savedToken(user, "abc-token");

    expect(saved.id).toBeDefined();
    expect(saved.token).toBe("abc-token");
  });
});
