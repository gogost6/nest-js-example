import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Comment } from "../comments/entities/comment.entity";
import { UsersService } from "../users/users.service";
import { CreatePostRequestDto } from "./dto/create-post-request.dto";
import { Post } from "./entities/post.entity";

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly usersService: UsersService,
  ) {}

  async getAllPosts(
    page = 0,
    size = 10,
  ): Promise<{
    content: any[];
    totalPages: number;
    totalElements: number;
    number: number;
  }> {
    const [posts, total] = await this.postRepo.findAndCount({
      order: { id: "DESC" },
      skip: page * size,
      take: size,
    });

    return {
      content: posts.map((p) => this.toResponse(p)),
      totalPages: Math.ceil(total / size),
      totalElements: total,
      number: page,
    };
  }

  async getById(id: number): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    return post;
  }

  async createPost(email: string, dto: CreatePostRequestDto): Promise<Post> {
    const user = await this.usersService.findByEmail(email);
    const post = this.postRepo.create({
      title: dto.title,
      body: dto.body,
      owner: user,
    });
    return this.postRepo.save(post);
  }

  async updatePost(
    id: number,
    email: string,
    dto: CreatePostRequestDto,
  ): Promise<Post> {
    const post = await this.getById(id);
    const user = await this.usersService.findByEmail(email);

    if (post.owner.id !== user.id) {
      throw new ForbiddenException("User is not the owner of this post!");
    }

    post.title = dto.title;
    post.body = dto.body;
    return this.postRepo.save(post);
  }

  async deletePost(id: number, email: string): Promise<void> {
    const post = await this.getById(id);
    const user = await this.usersService.findByEmail(email);

    if (post.owner.id !== user.id) {
      throw new ForbiddenException("User is not the owner of this post!");
    }

    // Delete comments first
    await this.commentRepo.delete({ post: { id } });
    await this.postRepo.delete(id);
  }

  toResponse(post: Post) {
    return {
      id: post.id,
      title: post.title,
      body: post.body,
      ownerEmail: post.owner?.email ?? null,
    };
  }
}
