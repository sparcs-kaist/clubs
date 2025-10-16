import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { Student } from "./Student";

@Index("club_delegate_d_club_delegate_enum_id_fk", ["clubDelegateEnumId"], {})
@Index("club_delegate_d_club_id_club_id_fk", ["clubId"], {})
@Index("club_delegate_d_student_id_student_id_fk", ["studentId"], {})
@Entity("club_delegate_d", { schema: "sparcs-clubs" })
export class ClubDelegateD {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("int", { name: "club_delegate_enum_id" })
  clubDelegateEnumId: number;

  @Column("datetime", { name: "start_term" })
  startTerm: Date;

  @Column("datetime", { name: "end_term", nullable: true })
  endTerm: Date | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Club, club => club.clubDelegateDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => Student, student => student.clubDelegateDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
