import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";

import { Registration } from "./Registration";
import { User } from "./User";

@Index("file_user_id_user_id_fk", ["userId"], {})
@Entity("file", { schema: "sparcs-clubs" })
export class File {
  @Column("varchar", { primary: true, name: "id", length: 128 })
  id: string;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "extension", length: 30 })
  extension: string;

  @Column("int", { name: "size" })
  size: number;

  @Column("int", { name: "user_id" })
  userId: number;

  @Column("datetime", { name: "signed_at" })
  signedAt: Date;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User, user => user.files, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Promise<User>;

  @OneToMany(
    () => Registration,
    registration => registration.registrationActivityPlanFile,
    { lazy: true },
  )
  registrations: Promise<Registration[]>;

  @OneToMany(
    () => Registration,
    registration => registration.registrationClubRuleFile,
    { lazy: true },
  )
  registrations2: Promise<Registration[]>;

  @OneToMany(
    () => Registration,
    registration => registration.registrationExternalInstructionFile,
    { lazy: true },
  )
  registrations3: Promise<Registration[]>;
}
