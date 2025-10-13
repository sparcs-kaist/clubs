import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ClubT } from "./ClubT";
import { ProfessorT } from "./ProfessorT";
import { Registration } from "./Registration";
import { User } from "./User";

@Index("professor_email_unique", ["email"], { unique: true })
@Index("professor_user_id_user_id_fk", ["userId"], {})
@Entity("professor", { schema: "sparcs-clubs" })
export class Professor {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id", nullable: true })
  userId: number | null;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", {
    name: "email",
    nullable: true,
    unique: true,
    length: 255,
  })
  email: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => ClubT, clubT => clubT.professor, { lazy: true })
  clubTs: Promise<ClubT[]>;

  @ManyToOne(() => User, user => user.professors, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Promise<User>;

  @OneToOne(() => ProfessorT, professorT => professorT.professor, {
    lazy: true,
  })
  professorT: Promise<ProfessorT>;

  @OneToMany(() => Registration, registration => registration.professor, {
    lazy: true,
  })
  registrations: Promise<Registration[]>;
}
