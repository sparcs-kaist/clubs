import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { SemesterD } from "./SemesterD";
import { Student } from "./Student";

@Index("club_student_t_student_id_student_id_fk", ["studentId"], {})
@Index("club_student_t_club_id_club_id_fk", ["clubId"], {})
@Index("club_student_t_semester_id_semester_d_id_fk", ["semesterId"], {})
@Entity("club_student_t", { schema: "sparcs-clubs" })
export class ClubStudentT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("int", { name: "club_id" })
  clubId: number;

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

  @ManyToOne(() => Club, club => club.clubStudentTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => SemesterD, semesterD => semesterD.clubStudentTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "semester_id", referencedColumnName: "id" }])
  semester: Promise<SemesterD>;

  @ManyToOne(() => Student, student => student.clubStudentTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
