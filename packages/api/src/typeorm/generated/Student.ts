import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ActivityCertificate } from "./ActivityCertificate";
import { ActivityParticipant } from "./ActivityParticipant";
import { ClubDelegateChangeRequest } from "./ClubDelegateChangeRequest";
import { ClubDelegateD } from "./ClubDelegateD";
import { ClubStudentT } from "./ClubStudentT";
import { CommonSpaceUsageOrderD } from "./CommonSpaceUsageOrderD";
import { DivisionPresidentD } from "./DivisionPresidentD";
import { Executive } from "./Executive";
import { FundingTransportationPassenger } from "./FundingTransportationPassenger";
import { PromotionalPrintingOrder } from "./PromotionalPrintingOrder";
import { Registration } from "./Registration";
import { RegistrationApplicationStudent } from "./RegistrationApplicationStudent";
import { RentalOrder } from "./RentalOrder";
import { StudentT } from "./StudentT";
import { User } from "./User";

@Index("student_number_unique", ["number"], { unique: true })
@Index("student_user_id_user_id_fk", ["userId"], {})
@Entity("student", { schema: "sparcs-clubs" })
export class Student {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "user_id", nullable: true })
  userId: number | null;

  @Column("int", { name: "number", unique: true })
  number: number;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "email", nullable: true, length: 255 })
  email: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(
    () => ActivityCertificate,
    activityCertificate => activityCertificate.student,
    { lazy: true },
  )
  activityCertificates: Promise<ActivityCertificate[]>;

  @OneToMany(
    () => ActivityParticipant,
    activityParticipant => activityParticipant.student,
    { lazy: true },
  )
  activityParticipants: Promise<ActivityParticipant[]>;

  @OneToMany(
    () => ClubDelegateChangeRequest,
    clubDelegateChangeRequest => clubDelegateChangeRequest.prevStudent,
    { lazy: true },
  )
  clubDelegateChangeRequests: Promise<ClubDelegateChangeRequest[]>;

  @OneToMany(
    () => ClubDelegateChangeRequest,
    clubDelegateChangeRequest => clubDelegateChangeRequest.student,
    { lazy: true },
  )
  clubDelegateChangeRequests2: Promise<ClubDelegateChangeRequest[]>;

  @OneToMany(() => ClubDelegateD, clubDelegateD => clubDelegateD.student, {
    lazy: true,
  })
  clubDelegateDs: Promise<ClubDelegateD[]>;

  @OneToMany(() => ClubStudentT, clubStudentT => clubStudentT.student, {
    lazy: true,
  })
  clubStudentTs: Promise<ClubStudentT[]>;

  @OneToMany(
    () => CommonSpaceUsageOrderD,
    commonSpaceUsageOrderD => commonSpaceUsageOrderD.chargeStudent,
    { lazy: true },
  )
  commonSpaceUsageOrderDs: Promise<CommonSpaceUsageOrderD[]>;

  @OneToMany(
    () => DivisionPresidentD,
    divisionPresidentD => divisionPresidentD.student,
    { lazy: true },
  )
  divisionPresidentDs: Promise<DivisionPresidentD[]>;

  @OneToOne(() => Executive, executive => executive.student, { lazy: true })
  executive: Promise<Executive>;

  @OneToMany(
    () => FundingTransportationPassenger,
    fundingTransportationPassenger => fundingTransportationPassenger.student,
    { lazy: true },
  )
  fundingTransportationPassengers: Promise<FundingTransportationPassenger[]>;

  @OneToMany(
    () => PromotionalPrintingOrder,
    promotionalPrintingOrder => promotionalPrintingOrder.student,
    { lazy: true },
  )
  promotionalPrintingOrders: Promise<PromotionalPrintingOrder[]>;

  @OneToMany(() => Registration, registration => registration.student, {
    lazy: true,
  })
  registrations: Promise<Registration[]>;

  @OneToMany(
    () => RegistrationApplicationStudent,
    registrationApplicationStudent => registrationApplicationStudent.student,
    { lazy: true },
  )
  registrationApplicationStudents: Promise<RegistrationApplicationStudent[]>;

  @OneToMany(() => RentalOrder, rentalOrder => rentalOrder.student, {
    lazy: true,
  })
  rentalOrders: Promise<RentalOrder[]>;

  @ManyToOne(() => User, user => user.students, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Promise<User>;

  @OneToMany(() => StudentT, studentT => studentT.student, { lazy: true })
  studentTs: Promise<StudentT[]>;
}
