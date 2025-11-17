import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Student } from "./Student";

@Index(
  "student_t_student_id_semester_id_unique_key",
  ["studentId", "semesterId"],
  { unique: true },
)
@Entity("student_t", { schema: "sparcs-clubs" })
export class StudentT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("int", { name: "student_enum" })
  studentEnum: number;

  @Column("int", { name: "student_status_enum" })
  studentStatusEnum: number;

  @Column("int", { name: "department", nullable: true })
  department: number | null;

  @Column("int", { name: "semester_id" })
  semesterId: number;

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

  @ManyToOne(() => Student, student => student.studentTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
