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
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CommentsService } from "../comments/comments.service";
import { CreatePostRequestDto } from "./dto/create-post-request.dto";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Get()
  getAllPosts(@Query("page") page = "0", @Query("size") size = "10") {
    return this.postsService.getAllPosts(
      parseInt(page, 10),
      parseInt(size, 10),
    );
  }

  @Get(":id")
  async getPostById(@Param("id", ParseIntPipe) id: number) {
    const post = await this.postsService.getById(id);
    return this.postsService.toResponse(post);
  }

  @Get(":id/comments")
  getCommentsByPostId(@Param("id", ParseIntPipe) id: number) {
    return this.commentsService.getCommentsByPostId(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(@Request() req, @Body() dto: CreatePostRequestDto) {
    const post = await this.postsService.createPost(req.user.email, dto);
    return this.postsService.toResponse(post);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePost(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: CreatePostRequestDto,
  ) {
    await this.postsService.updatePost(id, req.user.email, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param("id", ParseIntPipe) id: number, @Request() req) {
    await this.postsService.deletePost(id, req.user.email);
  }
}
