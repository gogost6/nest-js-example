import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { AuthRequestDto } from "../auth/dto/auth-request.dto";
import { Role } from "./entities/role.enum";
import { UserRole } from "./entities/user-role.entity";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async register(dto: AuthRequestDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("User already exists!");

    const hashed = await bcrypt.hash(dto.password, 10);
    const count = await this.userRepo.count();
    const roles = count === 0 ? [Role.ADMIN, Role.USER] : [Role.USER];

    const user = this.userRepo.create({ email: dto.email, password: hashed });
    await this.userRepo.save(user);

    // Insert roles into user_roles table
    for (const role of roles) {
      const ur = this.userRoleRepo.create({ userId: user.id, role, user });
      await this.userRoleRepo.save(ur);
    }

    return this.userRepo.findOne({ where: { id: user.id } });
  }

  async login(dto: AuthRequestDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException("Invalid email or password!");

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException("Invalid email or password!");

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateEmail(email: string, newEmail: string): Promise<User> {
    if (email === newEmail)
      throw new ConflictException("Old email same as new email!");

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException("User not found");

    user.email = newEmail;
    return this.userRepo.save(user);
  }

  async updatePassword(
    email: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<User> {
    if (oldPassword === newPassword)
      throw new ConflictException(
        "New password must be different from old password!",
      );

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException("User not found");

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) throw new UnauthorizedException("Old password doesn't match!");

    user.password = await bcrypt.hash(newPassword, 10);
    return this.userRepo.save(user);
  }

  async addRole(email: string, role: Role): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException("User not found");

    const alreadyHas = user.roles.includes(role);
    if (!alreadyHas) {
      const ur = this.userRoleRepo.create({ userId: user.id, role, user });
      await this.userRoleRepo.save(ur);
    }

    return this.userRepo.findOne({ where: { id: user.id } });
  }
}
