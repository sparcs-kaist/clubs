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

@Index(
  "activity_certificate_d_activity_certificate_enum_id_fk",
  ["activityCertificateStatusEnum"],
  {},
)
@Index("activity_certificate_club_id_club_id_fk", ["clubId"], {})
@Index("activity_certificate_student_id_student_id_fk", ["studentId"], {})
@Entity("activity_certificate", { schema: "sparcs-clubs" })
export class ActivityCertificate {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("varchar", {
    name: "student_phone_number",
    nullable: true,
    length: 30,
  })
  studentPhoneNumber: string | null;

  @Column("int", { name: "activity_certificate_status_enum" })
  activityCertificateStatusEnum: number;

  @Column("int", { name: "issue_number", nullable: true })
  issueNumber: number | null;

  @Column("datetime", { name: "issued_at", nullable: true })
  issuedAt: Date | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Club, club => club.activityCertificates, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => Student, student => student.activityCertificates, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
