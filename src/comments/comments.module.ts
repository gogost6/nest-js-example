import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { Comment } from "./entities/comment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), AuthModule],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}
