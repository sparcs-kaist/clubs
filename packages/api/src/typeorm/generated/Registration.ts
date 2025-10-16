import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { Division } from "./Division";
import { File } from "./File";
import { Professor } from "./Professor";
import { RegistrationExecutiveComment } from "./RegistrationExecutiveComment";
import { RegistrationStatusEnum } from "./RegistrationStatusEnum";
import { RegistrationTypeEnum } from "./RegistrationTypeEnum";
import { SemesterD } from "./SemesterD";
import { Student } from "./Student";

@Index("registration_club_id_club_id_fk", ["clubId"], {})
@Index("registration_student_id_student_id_fk", ["studentId"], {})
@Index("registration_division_id_division_id_fk", ["divisionId"], {})
@Index("registration_professor_id_professor_id_fk", ["professorId"], {})
@Index("registration_semester_d_id_fk", ["semesterDId"], {})
@Index(
  "registration_registration_type_enum_id_fk",
  ["registrationApplicationTypeEnumId"],
  {},
)
@Index(
  "registration_registration_status_enum_id_fk",
  ["registrationApplicationStatusEnumId"],
  {},
)
@Index(
  "registration_activity_plan_file_id_file_id_fk",
  ["registrationActivityPlanFileId"],
  {},
)
@Index(
  "registration_club_rule_file_id_file_id_fk",
  ["registrationClubRuleFileId"],
  {},
)
@Index(
  "registration_external_instruction_file_id_file_id_fk",
  ["registrationExternalInstructionFileId"],
  {},
)
@Entity("registration", { schema: "sparcs-clubs" })
export class Registration {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id", nullable: true })
  clubId: number | null;

  @Column("int", { name: "semester_d_id", nullable: true })
  semesterDId: number | null;

  @Column("int", { name: "registration_application_type_enum_id" })
  registrationApplicationTypeEnumId: number;

  @Column("int", { name: "registration_application_status_enum_id" })
  registrationApplicationStatusEnumId: number;

  @Column("varchar", { name: "club_name_kr", nullable: true, length: 30 })
  clubNameKr: string | null;

  @Column("varchar", { name: "club_name_en", nullable: true, length: 100 })
  clubNameEn: string | null;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("varchar", { name: "phone_number", nullable: true, length: 30 })
  phoneNumber: string | null;

  @Column("date", { name: "founded_at" })
  foundedAt: string;

  @Column("int", { name: "division_id" })
  divisionId: number;

  @Column("varchar", { name: "activity_field_kr", nullable: true, length: 255 })
  activityFieldKr: string | null;

  @Column("varchar", { name: "activity_field_en", nullable: true, length: 255 })
  activityFieldEn: string | null;

  @Column("int", { name: "professor_id", nullable: true })
  professorId: number | null;

  @Column("text", { name: "division_consistency", nullable: true })
  divisionConsistency: string | null;

  @Column("text", { name: "foundation_purpose", nullable: true })
  foundationPurpose: string | null;

  @Column("text", { name: "activity_plan", nullable: true })
  activityPlan: string | null;

  @Column("varchar", {
    name: "registration_activity_plan_file_id",
    nullable: true,
    length: 128,
  })
  registrationActivityPlanFileId: string | null;

  @Column("varchar", {
    name: "registration_club_rule_file_id",
    nullable: true,
    length: 128,
  })
  registrationClubRuleFileId: string | null;

  @Column("varchar", {
    name: "registration_external_instruction_file_id",
    nullable: true,
    length: 128,
  })
  registrationExternalInstructionFileId: string | null;

  @Column("timestamp", { name: "professor_approved_at", nullable: true })
  professorApprovedAt: Date | null;

  @Column("timestamp", { name: "reviewed_at", nullable: true })
  reviewedAt: Date | null;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", {
    name: "updated_at",
    nullable: true,
    default: () => "'now()'",
  })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => File, file => file.registrations, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([
    { name: "registration_activity_plan_file_id", referencedColumnName: "id" },
  ])
  registrationActivityPlanFile: Promise<File>;

  @ManyToOne(() => Club, club => club.registrations, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => File, file => file.registrations2, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([
    { name: "registration_club_rule_file_id", referencedColumnName: "id" },
  ])
  registrationClubRuleFile: Promise<File>;

  @ManyToOne(() => Division, division => division.registrations, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "division_id", referencedColumnName: "id" }])
  division: Promise<Division>;

  @ManyToOne(() => File, file => file.registrations3, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([
    {
      name: "registration_external_instruction_file_id",
      referencedColumnName: "id",
    },
  ])
  registrationExternalInstructionFile: Promise<File>;

  @ManyToOne(() => Professor, professor => professor.registrations, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "professor_id", referencedColumnName: "id" }])
  professor: Promise<Professor>;

  @ManyToOne(
    () => RegistrationStatusEnum,
    registrationStatusEnum => registrationStatusEnum.registrations,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([
    {
      name: "registration_application_status_enum_id",
      referencedColumnName: "enumId",
    },
  ])
  registrationApplicationStatusEnum: Promise<RegistrationStatusEnum>;

  @ManyToOne(
    () => RegistrationTypeEnum,
    registrationTypeEnum => registrationTypeEnum.registrations,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([
    {
      name: "registration_application_type_enum_id",
      referencedColumnName: "enumId",
    },
  ])
  registrationApplicationTypeEnum: Promise<RegistrationTypeEnum>;

  @ManyToOne(() => SemesterD, semesterD => semesterD.registrations, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "semester_d_id", referencedColumnName: "id" }])
  semesterD: Promise<SemesterD>;

  @ManyToOne(() => SemesterD, semesterD => semesterD.registrations2, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "semester_d_id", referencedColumnName: "id" }])
  semesterD_2: Promise<SemesterD>;

  @ManyToOne(() => Student, student => student.registrations, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;

  @OneToMany(
    () => RegistrationExecutiveComment,
    registrationExecutiveComment => registrationExecutiveComment.registration,
    { lazy: true },
  )
  registrationExecutiveComments: Promise<RegistrationExecutiveComment[]>;
}
