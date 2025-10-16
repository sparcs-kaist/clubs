import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Professor } from "./Professor";

@Index("professor_t_professor_id_unique", ["professorId"], { unique: true })
@Entity("professor_t", { schema: "sparcs-clubs" })
export class ProfessorT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "professor_id", unique: true })
  professorId: number;

  @Column("int", { name: "professor_enum", nullable: true })
  professorEnum: number | null;

  @Column("int", { name: "department", nullable: true })
  department: number | null;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term", nullable: true })
  endTerm: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => Professor, professor => professor.professorT, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "professor_id", referencedColumnName: "id" }])
  professor: Promise<Professor>;
}
