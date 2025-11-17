import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./User";

@Index("expires_at_idx", ["expiresAt"], {})
@Index("auth_activated_refresh_tokens_user_id_user_id_fk", ["userId"], {})
@Entity("auth_activated_refresh_tokens", { schema: "sparcs-clubs" })
export class AuthActivatedRefreshTokens {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id" })
  userId: number;

  @Column("datetime", { name: "expires_at" })
  expiresAt: Date;

  @Column("text", { name: "refresh_token" })
  refreshToken: string;

  @ManyToOne(() => User, user => user.authActivatedRefreshTokens, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Promise<User>;
}
