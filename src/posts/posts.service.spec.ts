import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Comment } from "../comments/entities/comment.entity";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { CreatePostRequestDto } from "./dto/create-post-request.dto";
import { Post } from "./entities/post.entity";
import { PostsService } from "./posts.service";

const mockPostRepo = () => ({
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockCommentRepo = () => ({
  delete: jest.fn(),
});

const mockUsersService = () => ({
  findByEmail: jest.fn(),
});

describe("PostsService", () => {
  let service: PostsService;
  let postRepo: ReturnType<typeof mockPostRepo>;
  let commentRepo: ReturnType<typeof mockCommentRepo>;
  let usersService: ReturnType<typeof mockUsersService>;

  const makeUser = (id: number, email: string) => ({ id, email }) as User;

  const makePost = (id: number, owner: User, title: string, body: string) => {
    const p = new Post();
    p.id = id;
    p.owner = owner;
    p.title = title;
    p.body = body;
    return p;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useFactory: mockPostRepo },
        { provide: getRepositoryToken(Comment), useFactory: mockCommentRepo },
        { provide: UsersService, useFactory: mockUsersService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepo = module.get(getRepositoryToken(Post));
    commentRepo = module.get(getRepositoryToken(Comment));
    usersService = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe("getAllPosts", () => {
    it("returns paginated response", async () => {
      const owner = makeUser(1, "owner@test.com");
      const posts = [
        makePost(1, owner, "Title 1", "Body 1"),
        makePost(2, owner, "Title 2", "Body 2"),
      ];
      postRepo.findAndCount.mockResolvedValue([posts, 2]);

      const result = await service.getAllPosts(0, 10);

      expect(result.content).toHaveLength(2);
      expect(result.totalElements).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.number).toBe(0);
    });
  });

  describe("getById", () => {
    it("returns post when found", async () => {
      const owner = makeUser(1, "owner@test.com");
      const post = makePost(1, owner, "Title", "Body");
      postRepo.findOne.mockResolvedValue(post);

      const result = await service.getById(1);

      expect(result).toBe(post);
    });

    it("throws NotFoundException when post not found", async () => {
      postRepo.findOne.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("createPost", () => {
    it("saves post with owner", async () => {
      const owner = makeUser(1, "owner@test.com");
      const post = makePost(1, owner, "New title", "New body");
      usersService.findByEmail.mockResolvedValue(owner);
      postRepo.create.mockReturnValue(post);
      postRepo.save.mockResolvedValue(post);

      const dto: CreatePostRequestDto = {
        title: "New title",
        body: "New body",
      };
      const result = await service.createPost("owner@test.com", dto);

      expect(postRepo.save).toHaveBeenCalled();
      expect(result.owner).toBe(owner);
    });

    it("throws NotFoundException when user not found", async () => {
      usersService.findByEmail.mockRejectedValue(
        new NotFoundException("User not found"),
      );

      const dto: CreatePostRequestDto = { title: "Title", body: "Body" };

      await expect(service.createPost("unknown@test.com", dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updatePost", () => {
    it("updates post when user is owner", async () => {
      const owner = makeUser(1, "owner@test.com");
      const post = makePost(1, owner, "Old title", "Old body");
      postRepo.findOne.mockResolvedValue(post);
      usersService.findByEmail.mockResolvedValue(owner);
      postRepo.save.mockResolvedValue({
        ...post,
        title: "Updated",
        body: "Updated body",
      });

      const dto: CreatePostRequestDto = {
        title: "Updated",
        body: "Updated body",
      };
      await service.updatePost(1, "owner@test.com", dto);

      expect(postRepo.save).toHaveBeenCalled();
    });

    it("throws ForbiddenException when user is not owner", async () => {
      const owner = makeUser(1, "owner@test.com");
      const other = makeUser(2, "other@test.com");
      const post = makePost(1, owner, "Title", "Body");
      postRepo.findOne.mockResolvedValue(post);
      usersService.findByEmail.mockResolvedValue(other);

      await expect(
        service.updatePost(1, "other@test.com", { title: "X", body: "Y" }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws NotFoundException when post not found", async () => {
      postRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updatePost(999, "owner@test.com", { title: "X", body: "Y" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deletePost", () => {
    it("deletes post when user is owner", async () => {
      const owner = makeUser(1, "owner@test.com");
      const post = makePost(1, owner, "Title", "Body");
      postRepo.findOne.mockResolvedValue(post);
      usersService.findByEmail.mockResolvedValue(owner);
      commentRepo.delete.mockResolvedValue({ affected: 0, raw: [] });
      postRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.deletePost(1, "owner@test.com");

      expect(commentRepo.delete).toHaveBeenCalledWith({ post: { id: 1 } });
      expect(postRepo.delete).toHaveBeenCalledWith(1);
    });

    it("throws ForbiddenException when user is not owner", async () => {
      const owner = makeUser(1, "owner@test.com");
      const other = makeUser(2, "other@test.com");
      const post = makePost(1, owner, "Title", "Body");
      postRepo.findOne.mockResolvedValue(post);
      usersService.findByEmail.mockResolvedValue(other);

      await expect(service.deletePost(1, "other@test.com")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
