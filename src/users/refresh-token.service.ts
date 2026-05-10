import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { RefreshToken } from "./entities/refresh-token.entity";
import { User } from "./entities/user.entity";

@Injectable()
export class RefreshTokenService {
  private static readonly DAYS = 7;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async createRefreshToken(user: User): Promise<RefreshToken> {
    // Revoke existing tokens for this user
    await this.refreshTokenRepo.delete({ user: { id: user.id } });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + RefreshTokenService.DAYS);

    const rt = this.refreshTokenRepo.create({
      token: uuidv4(),
      user,
      expiresAt,
      revoked: false,
    });

    return this.refreshTokenRepo.save(rt);
  }

  async validateRefreshToken(tokenValue: string): Promise<User> {
    const rt = await this.refreshTokenRepo.findOne({
      where: { token: tokenValue },
      relations: ["user"],
    });

    if (!rt) throw new NotFoundException("Refresh token not found");
    if (rt.revoked)
      throw new UnauthorizedException("Refresh token has been revoked");
    if (rt.expiresAt < new Date())
      throw new UnauthorizedException("Refresh token has expired");

    return rt.user;
  }

  async revokeTokensForUser(user: User): Promise<void> {
    await this.refreshTokenRepo.delete({ user: { id: user.id } });
  }
}
