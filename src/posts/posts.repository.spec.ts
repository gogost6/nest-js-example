/**
 * Integration tests for the Post TypeORM repository.
 * Mirrors PostRepositoryTest.java (@DataJpaTest with NONE replacement).
 *
 * Requires a running PostgreSQL instance with Flyway migrations applied.
 * Connection config is read from environment variables (see .env).
 */
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Comment } from "../comments/entities/comment.entity";
import { RefreshToken } from "../users/entities/refresh-token.entity";
import { Role } from "../users/entities/role.enum";
import { UserRole } from "../users/entities/user-role.entity";
import { User } from "../users/entities/user.entity";
import { RefreshTokenSubscriber } from "../users/subscribers/refresh-token.subscriber";
import { UserSubscriber } from "../users/subscribers/user.subscriber";
import { Post } from "./entities/post.entity";

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

describe("PostRepository (integration)", () => {
  let module: TestingModule;
  let postRepo: Repository<Post>;
  let userRepo: Repository<User>;
  let commentRepo: Repository<Comment>;
  let refreshTokenRepo: Repository<RefreshToken>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(DB_CONFIG),
        TypeOrmModule.forFeature([User, UserRole, RefreshToken, Post, Comment]),
      ],
      providers: [UserSubscriber, RefreshTokenSubscriber],
    }).compile();

    postRepo = module.get(getRepositoryToken(Post));
    userRepo = module.get(getRepositoryToken(User));
    commentRepo = module.get(getRepositoryToken(Comment));
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await postRepo.query(
      "TRUNCATE TABLE comment, posts, refresh_tokens, user_roles, users CASCADE",
    );
  });

  const createOwner = async (): Promise<User> => {
    const user = userRepo.create({
      email: `owner${Date.now()}@mail.com`,
      password: "hashed-password",
      userRoles: [],
    });
    const saved = await userRepo.save(user);
    // Insert role separately
    await userRepo.query(
      "INSERT INTO user_roles (user_id, roles) VALUES ($1, $2)",
      [saved.id, Role.USER],
    );
    return saved;
  };

  const createPost = async (title: string, body: string): Promise<Post> => {
    const owner = await createOwner();
    const post = postRepo.create({ title, body, owner });
    return postRepo.save(post);
  };

  it("save should persist a post", async () => {
    const saved = await createPost("Test title", "Test Body");

    expect(saved.id).toBeDefined();
    expect(saved.title).toBe("Test title");
    expect(saved.owner).toBeDefined();
  });

  it("findAll should return all posts", async () => {
    await createPost("Title 1", "Body 1");
    await createPost("Title 2", "Body 2");

    const posts = await postRepo.find();

    expect(posts).toHaveLength(2);
  });

  it("findById should return the correct post", async () => {
    const post = await createPost("Title", "Body");

    const found = await postRepo.findOne({ where: { id: post.id } });

    expect(found).not.toBeNull();
    expect(found!.title).toBe("Title");
  });

  it("update should modify the post", async () => {
    const post = await createPost("Old title", "Old body");

    post.title = "New title";
    await postRepo.save(post);

    const updated = await postRepo.findOne({ where: { id: post.id } });
    expect(updated!.title).toBe("New title");
  });

  it("delete should remove the post", async () => {
    const post = await createPost("Title", "Body");

    await postRepo.delete(post.id);

    const result = await postRepo.findOne({ where: { id: post.id } });
    expect(result).toBeNull();
  });

  it("findById should return null when post does not exist", async () => {
    const result = await postRepo.findOne({ where: { id: 999 } });

    expect(result).toBeNull();
  });
});
