import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { CommentsModule } from "../comments/comments.module";
import { Comment } from "../comments/entities/comment.entity";
import { Post } from "./entities/post.entity";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment]),
    AuthModule,
    CommentsModule,
  ],
  providers: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
