import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { ClubRoomT } from "./ClubRoomT";
import { ClubStudentT } from "./ClubStudentT";
import { ClubT } from "./ClubT";
import { ProfessorSignStatus } from "./ProfessorSignStatus";
import { Registration } from "./Registration";
import { RegistrationApplicationStudent } from "./RegistrationApplicationStudent";
import { RegistrationDeadlineD } from "./RegistrationDeadlineD";

@Entity("semester_d", { schema: "sparcs-clubs" })
export class SemesterD {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "year" })
  year: number;

  @Column("varchar", { name: "name", length: 10 })
  name: string;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term" })
  endTerm: string;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => ClubRoomT, clubRoomT => clubRoomT.semester, { lazy: true })
  clubRoomTs: Promise<ClubRoomT[]>;

  @OneToMany(() => ClubStudentT, clubStudentT => clubStudentT.semester, {
    lazy: true,
  })
  clubStudentTs: Promise<ClubStudentT[]>;

  @OneToMany(() => ClubT, clubT => clubT.semester, { lazy: true })
  clubTs: Promise<ClubT[]>;

  @OneToMany(
    () => ProfessorSignStatus,
    professorSignStatus => professorSignStatus.semester,
    { lazy: true },
  )
  professorSignStatuses: Promise<ProfessorSignStatus[]>;

  @OneToMany(() => Registration, registration => registration.semesterD, {
    lazy: true,
  })
  registrations: Promise<Registration[]>;

  @OneToMany(() => Registration, registration => registration.semesterD_2, {
    lazy: true,
  })
  registrations2: Promise<Registration[]>;

  @OneToMany(
    () => RegistrationApplicationStudent,
    registrationApplicationStudent => registrationApplicationStudent.semesterD,
    { lazy: true },
  )
  registrationApplicationStudents: Promise<RegistrationApplicationStudent[]>;

  @OneToMany(
    () => RegistrationDeadlineD,
    registrationDeadlineD => registrationDeadlineD.semesterD,
    { lazy: true },
  )
  registrationDeadlineDs: Promise<RegistrationDeadlineD[]>;
}
