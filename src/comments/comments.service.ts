import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { CommentResponseDto } from "./dto/comment-response.dto";
import { Comment } from "./entities/comment.entity";

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly usersService: UsersService,
  ) {}

  private toResponse(c: Comment): CommentResponseDto {
    return {
      id: c.id,
      content: c.content,
      ownerEmail: c.owner?.email ?? null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  async getCommentsByPostId(postId: number): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepo.find({
      where: { post: { id: postId } },
      relations: ["owner"],
    });
    return comments.map((c) => this.toResponse(c));
  }

  async getCommentById(commentId: number): Promise<CommentResponseDto> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ["owner"],
    });
    if (!comment) throw new NotFoundException("Comment not found");
    return this.toResponse(comment);
  }

  async create(
    postId: number,
    email: string,
    content: string,
  ): Promise<CommentResponseDto> {
    const user = await this.usersService.findByEmail(email);
    const comment = this.commentRepo.create({
      post: { id: postId } as any,
      owner: user,
      content,
    });
    const saved = await this.commentRepo.save(comment);
    // Reload to get proper relations
    return this.getCommentById(saved.id);
  }

  async update(
    commentId: number,
    email: string,
    content: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ["owner"],
    });
    if (!comment) throw new NotFoundException("Comment not found");

    if (!comment.owner || comment.owner.email !== email) {
      throw new ForbiddenException("You are not the owner of this comment!");
    }

    comment.content = content;
    await this.commentRepo.save(comment);
    return this.toResponse(comment);
  }

  async delete(commentId: number, email: string): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ["owner"],
    });
    if (!comment) throw new NotFoundException("Comment not found");

    if (!comment.owner || comment.owner.email !== email) {
      throw new ForbiddenException("You are not the owner of this comment!");
    }

    await this.commentRepo.delete(commentId);
  }
}
