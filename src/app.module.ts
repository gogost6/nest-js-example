import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { CatModule } from "./cat/cat.module";
import { CommentsModule } from "./comments/comments.module";
import { Comment } from "./comments/entities/comment.entity";
import { Post } from "./posts/entities/post.entity";
import { PostsModule } from "./posts/posts.module";
import { RefreshToken } from "./users/entities/refresh-token.entity";
import { UserRole } from "./users/entities/user-role.entity";
import { User } from "./users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST ?? "localhost",
      port: parseInt(process.env.DB_PORT ?? "5432", 10),
      database: process.env.DB_NAME ?? "myappdb",
      username: process.env.DB_USER ?? "myuser",
      password: process.env.DB_PASSWORD ?? "mypassword",
      entities: [User, UserRole, RefreshToken, Post, Comment],
      synchronize: false, // tables are managed by Flyway
      logging: true,
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 5 * 60 * 1000, // 5 min default
      max: 500,
    }),
    AuthModule,
    PostsModule,
    CommentsModule,
    CatModule,
  ],
})
export class AppModule {}
