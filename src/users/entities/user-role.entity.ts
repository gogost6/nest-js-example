import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";

/**
 * Maps to the `user_roles` junction table created by Flyway V1 migration.
 * Composite PK: (user_id, roles).
 */
@Entity("user_roles")
export class UserRole {
  @PrimaryColumn({ name: "user_id", type: "bigint" })
  userId: number;

  @PrimaryColumn({ name: "roles" })
  role: string;

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: "user_id" })
  user: User;
}
