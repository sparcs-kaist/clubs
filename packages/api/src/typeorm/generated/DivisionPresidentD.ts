import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { Division } from "./Division";
import { Student } from "./Student";

@Index("division_president_d_division_id_division_id_fk", ["divisionId"], {})
@Index("division_president_d_student_id_student_id_fk", ["studentId"], {})
@Index(
  "division_president_d_originated_club_id_club_id_fk",
  ["originatedClubId"],
  {},
)
@Entity("division_president_d", { schema: "sparcs-clubs" })
export class DivisionPresidentD {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "division_id" })
  divisionId: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term", nullable: true })
  endTerm: string | null;

  @Column("int", { name: "originated_club_id" })
  originatedClubId: number;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Division, division => division.divisionPresidentDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "division_id", referencedColumnName: "id" }])
  division: Promise<Division>;

  @ManyToOne(() => Club, club => club.divisionPresidentDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "originated_club_id", referencedColumnName: "id" }])
  originatedClub: Promise<Club>;

  @ManyToOne(() => Student, student => student.divisionPresidentDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
