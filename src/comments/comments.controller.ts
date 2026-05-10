import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CommentsService } from "./comments.service";
import { CreateCommentRequestDto } from "./dto/create-comment-request.dto";

@Controller("comment")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(":post_id/post")
  getAllByPostId(@Param("post_id", ParseIntPipe) postId: number) {
    return this.commentsService.getCommentsByPostId(postId);
  }

  @Get(":comment_id")
  getCommentById(@Param("comment_id", ParseIntPipe) commentId: number) {
    return this.commentsService.getCommentById(commentId);
  }

  @Post(":post_id")
  @UseGuards(JwtAuthGuard)
  addComment(
    @Param("post_id", ParseIntPipe) postId: number,
    @Request() req,
    @Body() dto: CreateCommentRequestDto,
  ) {
    return this.commentsService.create(postId, req.user.email, dto.content);
  }

  @Put(":comment_id")
  @UseGuards(JwtAuthGuard)
  updateComment(
    @Param("comment_id", ParseIntPipe) commentId: number,
    @Request() req,
    @Body() dto: CreateCommentRequestDto,
  ) {
    return this.commentsService.update(commentId, req.user.email, dto.content);
  }

  @Delete(":comment_id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteById(
    @Param("comment_id", ParseIntPipe) commentId: number,
    @Request() req,
  ) {
    return this.commentsService.delete(commentId, req.user.email);
  }
}
