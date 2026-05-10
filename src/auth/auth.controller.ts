import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { Role } from "../users/entities/role.enum";
import { RefreshTokenService } from "../users/refresh-token.service";
import { UsersService } from "../users/users.service";
import { Roles } from "./decorators/roles.decorator";
import { AuthRequestDto } from "./dto/auth-request.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { RefreshRequestDto } from "./dto/refresh-request.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { JwtTokenService } from "./jwt-token.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  @Post("register")
  async register(@Body() dto: AuthRequestDto): Promise<AuthResponseDto> {
    const user = await this.usersService.register(dto);
    const token = this.jwtTokenService.generateToken(user);
    const rt = await this.refreshTokenService.createRefreshToken(user);
    return new AuthResponseDto(token, rt.token);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: AuthRequestDto): Promise<AuthResponseDto> {
    const user = await this.usersService.login(dto);
    const token = this.jwtTokenService.generateToken(user);
    const rt = await this.refreshTokenService.createRefreshToken(user);
    return new AuthResponseDto(token, rt.token);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshRequestDto): Promise<AuthResponseDto> {
    const user = await this.refreshTokenService.validateRefreshToken(
      dto.refreshToken,
    );
    const token = this.jwtTokenService.generateToken(user);
    const rt = await this.refreshTokenService.createRefreshToken(user);
    return new AuthResponseDto(token, rt.token);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Request() req): Promise<void> {
    const user = await this.usersService.findByEmail(req.user.email);
    await this.refreshTokenService.revokeTokensForUser(user);
  }

  @Put("email")
  @UseGuards(JwtAuthGuard)
  async updateEmail(
    @Request() req,
    @Query("newEmail") newEmail: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.updateEmail(req.user.email, newEmail);
    const token = this.jwtTokenService.generateToken(user);
    const rt = await this.refreshTokenService.createRefreshToken(user);
    return new AuthResponseDto(token, rt.token);
  }

  @Put("password")
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Request() req,
    @Query("oldPassword") oldPassword: string,
    @Query("newPassword") newPassword: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.updatePassword(
      req.user.email,
      oldPassword,
      newPassword,
    );
    const token = this.jwtTokenService.generateToken(user);
    const rt = await this.refreshTokenService.createRefreshToken(user);
    return new AuthResponseDto(token, rt.token);
  }

  @Put("users/:email/roles/:role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ROLE_ADMIN")
  async addRoleToUser(
    @Param("email") email: string,
    @Param("role") role: Role,
  ) {
    return this.usersService.addRole(email, role);
  }
}
