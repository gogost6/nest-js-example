import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RefreshToken } from "../users/entities/refresh-token.entity";
import { UserRole } from "../users/entities/user-role.entity";
import { User } from "../users/entities/user.entity";
import { RefreshTokenService } from "../users/refresh-token.service";
import { RefreshTokenSubscriber } from "../users/subscribers/refresh-token.subscriber";
import { UserSubscriber } from "../users/subscribers/user.subscriber";
import { UsersService } from "../users/users.service";
import { AuthController } from "./auth.controller";
import { JwtTokenService } from "./jwt-token.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole, RefreshToken]),
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: "1h" },
      }),
    }),
  ],
  providers: [
    UsersService,
    RefreshTokenService,
    JwtTokenService,
    JwtStrategy,
    UserSubscriber,
    RefreshTokenSubscriber,
  ],
  controllers: [AuthController],
  exports: [UsersService, JwtTokenService, RefreshTokenService, TypeOrmModule],
})
export class AuthModule {}
