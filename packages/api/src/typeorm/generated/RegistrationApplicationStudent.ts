import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { RegistrationApplicationStudentStatusEnum } from "./RegistrationApplicationStudentStatusEnum";
import { SemesterD } from "./SemesterD";
import { Student } from "./Student";

@Index(
  "registration_application_student_student_id_student_id_fk",
  ["studentId"],
  {},
)
@Index("registration_application_student_club_id_club_id_fk", ["clubId"], {})
@Index(
  "registration_application_student_semester_d_id_semester_d_id_fk",
  ["semesterDId"],
  {},
)
@Index(
  "registration_application_student_status_enum_id_fk",
  ["registrationApplicationStudentStatusEnum"],
  {},
)
@Entity("registration_application_student", { schema: "sparcs-clubs" })
export class RegistrationApplicationStudent {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "semester_d_id", nullable: true })
  semesterDId: number | null;

  @Column("int", { name: "registration_application_student_status_enum" })
  registrationApplicationStudentStatusEnum: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Club, club => club.registrationApplicationStudents, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(
    () => SemesterD,
    semesterD => semesterD.registrationApplicationStudents,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "semester_d_id", referencedColumnName: "id" }])
  semesterD: Promise<SemesterD>;

  @ManyToOne(
    () => RegistrationApplicationStudentStatusEnum,
    registrationApplicationStudentStatusEnum =>
      registrationApplicationStudentStatusEnum.registrationApplicationStudents,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([
    {
      name: "registration_application_student_status_enum",
      referencedColumnName: "enumId",
    },
  ])
  registrationApplicationStudentStatusEnum2: Promise<RegistrationApplicationStudentStatusEnum>;

  @ManyToOne(
    () => Student,
    student => student.registrationApplicationStudents,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
