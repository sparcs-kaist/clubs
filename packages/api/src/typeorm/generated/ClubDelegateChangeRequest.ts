import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { ClubDelegateChangeRequestStatusEnum } from "./ClubDelegateChangeRequestStatusEnum";
import { Student } from "./Student";

@Index("club_delegate_change_request_club_id_club_id_fk", ["clubId"], {})
@Index(
  "club_delegate_change_request_prev_student_id_student_id_fk",
  ["prevStudentId"],
  {},
)
@Index(
  "club_delegate_change_request_student_id_student_id_fk",
  ["studentId"],
  {},
)
@Index(
  "club_delegate_change_request_fk",
  ["clubDelegateChangeRequestStatusEnumId"],
  {},
)
@Entity("club_delegate_change_request", { schema: "sparcs-clubs" })
export class ClubDelegateChangeRequest {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "prev_student_id" })
  prevStudentId: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("int", { name: "club_delegate_change_request_status_enum_id" })
  clubDelegateChangeRequestStatusEnumId: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Club, club => club.clubDelegateChangeRequests, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(
    () => ClubDelegateChangeRequestStatusEnum,
    clubDelegateChangeRequestStatusEnum =>
      clubDelegateChangeRequestStatusEnum.clubDelegateChangeRequests,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([
    {
      name: "club_delegate_change_request_status_enum_id",
      referencedColumnName: "enumId",
    },
  ])
  clubDelegateChangeRequestStatusEnum: Promise<ClubDelegateChangeRequestStatusEnum>;

  @ManyToOne(() => Student, student => student.clubDelegateChangeRequests, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "prev_student_id", referencedColumnName: "id" }])
  prevStudent: Promise<Student>;

  @ManyToOne(() => Student, student => student.clubDelegateChangeRequests2, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
