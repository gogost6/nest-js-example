import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService } from "@nestjs/jwt";
import { User } from "../users/entities/user.entity";

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: NestJwtService) {}

  generateToken(user: User): string {
    const roles = user.roles.map((r) => `ROLE_${r}`);
    const payload = {
      sub: user.email,
      userId: user.id,
      roles,
      iss: "demo-api",
    };

    return this.jwtService.sign(payload, { expiresIn: "1h" });
  }
}
