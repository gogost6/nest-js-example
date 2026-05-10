import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CommentsService } from "../comments/comments.service";
import { GlobalExceptionFilter } from "../common/filters/global-exception.filter";
import { User } from "../users/entities/user.entity";
import { Post } from "./entities/post.entity";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

const mockPostsService = {
  getAllPosts: jest.fn(),
  getById: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  toResponse: jest.fn(),
};

const mockCommentsService = {
  getCommentsByPostId: jest.fn(),
};

// Override JwtAuthGuard so it doesn't validate real tokens in unit tests
const fakeJwtGuard = {
  canActivate: (ctx: any) => {
    const req = ctx.switchToHttp().getRequest();
    req.user = { email: "owner@mail.com", userId: 1, roles: ["ROLE_USER"] };
    return true;
  },
};

describe("PostsController", () => {
  let app: INestApplication;

  const makeUser = (email: string) => ({ id: 1, email }) as User;

  const makePost = (owner: User, title: string, body: string) => {
    const p = new Post();
    p.id = 1;
    p.owner = owner;
    p.title = title;
    p.body = body;
    return p;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        { provide: PostsService, useValue: mockPostsService },
        { provide: CommentsService, useValue: mockCommentsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(fakeJwtGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await app.close();
  });

  it("GET /posts returns paginated content", async () => {
    mockPostsService.getAllPosts.mockResolvedValue({
      content: [
        {
          id: 1,
          title: "Title 1",
          body: "Body 1",
          ownerEmail: "owner@mail.com",
        },
        {
          id: 2,
          title: "Title 2",
          body: "Body 2",
          ownerEmail: "owner@mail.com",
        },
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
    });

    const res = await request(app.getHttpServer()).get("/posts");

    expect(res.status).toBe(200);
    expect(res.body.content[0].title).toBe("Title 1");
  });

  it("POST /posts creates a post and returns it", async () => {
    const owner = makeUser("owner@mail.com");
    const post = makePost(owner, "New title", "New body");
    mockPostsService.createPost.mockResolvedValue(post);
    mockPostsService.toResponse.mockReturnValue({
      id: 1,
      title: "New title",
      body: "New body",
      ownerEmail: "owner@mail.com",
    });

    const res = await request(app.getHttpServer())
      .post("/posts")
      .send({ title: "New title", body: "New body" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("New title");
  });

  it("PUT /posts/:id returns 200", async () => {
    mockPostsService.updatePost.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .put("/posts/1")
      .send({ title: "Updated", body: "Updated body" });

    expect(res.status).toBe(200);
  });

  it("DELETE /posts/:id returns 204", async () => {
    mockPostsService.deletePost.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer()).delete("/posts/1");

    expect(res.status).toBe(204);
  });

  it("GET /posts/:id/comments returns comments array", async () => {
    mockCommentsService.getCommentsByPostId.mockResolvedValue([
      { id: 1, content: "Hello", ownerEmail: "mail@example.com" },
    ]);

    const res = await request(app.getHttpServer()).get("/posts/1/comments");

    expect(res.status).toBe(200);
    expect(res.body[0].content).toBe("Hello");
  });
});
