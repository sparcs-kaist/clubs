import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./User";

@Index("user_privacy_policy_agreement_user_id_user_id_fk", ["userId"], {})
@Entity("user_privacy_policy_agreement", { schema: "sparcs-clubs" })
export class UserPrivacyPolicyAgreement {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id" })
  userId: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, user => user.userPrivacyPolicyAgreements, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Promise<User>;
}
