import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { AuthActivatedRefreshTokens } from "./AuthActivatedRefreshTokens";
import { Employee } from "./Employee";
import { Executive } from "./Executive";
import { File } from "./File";
import { MeetingAttendanceTimeT } from "./MeetingAttendanceTimeT";
import { MeetingVoteResult } from "./MeetingVoteResult";
import { Professor } from "./Professor";
import { Student } from "./Student";
import { UserPrivacyPolicyAgreement } from "./UserPrivacyPolicyAgreement";

@Index("user_sid_unique", ["sid"], { unique: true })
@Entity("user", { schema: "sparcs-clubs" })
export class User {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "sid", nullable: true, unique: true, length: 30 })
  sid: string | null;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "email", nullable: true, length: 255 })
  email: string | null;

  @Column("varchar", { name: "phone_number", nullable: true, length: 30 })
  phoneNumber: string | null;

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

  @OneToMany(
    () => AuthActivatedRefreshTokens,
    authActivatedRefreshTokens => authActivatedRefreshTokens.user,
    { lazy: true },
  )
  authActivatedRefreshTokens: Promise<AuthActivatedRefreshTokens[]>;

  @OneToMany(() => Employee, employee => employee.user, { lazy: true })
  employees: Promise<Employee[]>;

  @OneToMany(() => Executive, executive => executive.user, { lazy: true })
  executives: Promise<Executive[]>;

  @OneToMany(() => File, file => file.user, { lazy: true })
  files: Promise<File[]>;

  @OneToMany(
    () => MeetingAttendanceTimeT,
    meetingAttendanceTimeT => meetingAttendanceTimeT.user,
    { lazy: true },
  )
  meetingAttendanceTimeTs: Promise<MeetingAttendanceTimeT[]>;

  @OneToMany(
    () => MeetingAttendanceTimeT,
    meetingAttendanceTimeT => meetingAttendanceTimeT.user_2,
    { lazy: true },
  )
  meetingAttendanceTimeTs2: Promise<MeetingAttendanceTimeT[]>;

  @OneToMany(
    () => MeetingVoteResult,
    meetingVoteResult => meetingVoteResult.user,
    { lazy: true },
  )
  meetingVoteResults: Promise<MeetingVoteResult[]>;

  @OneToMany(() => Professor, professor => professor.user, { lazy: true })
  professors: Promise<Professor[]>;

  @OneToMany(() => Student, student => student.user, { lazy: true })
  students: Promise<Student[]>;

  @OneToMany(
    () => UserPrivacyPolicyAgreement,
    userPrivacyPolicyAgreement => userPrivacyPolicyAgreement.user,
    { lazy: true },
  )
  userPrivacyPolicyAgreements: Promise<UserPrivacyPolicyAgreement[]>;
}
