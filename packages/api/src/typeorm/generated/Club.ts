import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ActivityCertificate } from "./ActivityCertificate";
import { ActivityClubChargedExecutive } from "./ActivityClubChargedExecutive";
import { ClubDelegateChangeRequest } from "./ClubDelegateChangeRequest";
import { ClubDelegateD } from "./ClubDelegateD";
import { ClubDivisionT } from "./ClubDivisionT";
import { ClubRoomT } from "./ClubRoomT";
import { ClubStudentT } from "./ClubStudentT";
import { ClubT } from "./ClubT";
import { CommonSpaceUsageOrderD } from "./CommonSpaceUsageOrderD";
import { Division } from "./Division";
import { DivisionPermanentClubD } from "./DivisionPermanentClubD";
import { DivisionPresidentD } from "./DivisionPresidentD";
import { Funding } from "./Funding";
import { MeetingAttendanceDay } from "./MeetingAttendanceDay";
import { ProfessorSignStatus } from "./ProfessorSignStatus";
import { PromotionalPrintingOrder } from "./PromotionalPrintingOrder";
import { Registration } from "./Registration";
import { RegistrationApplicationStudent } from "./RegistrationApplicationStudent";
import { RentalOrder } from "./RentalOrder";

@Index("club_name_kr_unique", ["nameKr"], { unique: true })
@Index("club_name_en_unique", ["nameEn"], { unique: true })
@Index("club_division_id_division_id_fk", ["divisionId"], {})
@Entity("club", { schema: "sparcs-clubs" })
export class Club {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name_kr", unique: true, length: 30 })
  nameKr: string;

  @Column("varchar", { name: "name_en", unique: true, length: 100 })
  nameEn: string;

  @Column("int", { name: "division_id" })
  divisionId: number;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("int", { name: "founding_year" })
  foundingYear: number;

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
    activityCertificate => activityCertificate.club,
    { lazy: true },
  )
  activityCertificates: Promise<ActivityCertificate[]>;

  @OneToMany(
    () => ActivityClubChargedExecutive,
    activityClubChargedExecutive => activityClubChargedExecutive.club,
    { lazy: true },
  )
  activityClubChargedExecutives: Promise<ActivityClubChargedExecutive[]>;

  @ManyToOne(() => Division, division => division.clubs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "division_id", referencedColumnName: "id" }])
  division: Promise<Division>;

  @OneToMany(
    () => ClubDelegateChangeRequest,
    clubDelegateChangeRequest => clubDelegateChangeRequest.club,
    { lazy: true },
  )
  clubDelegateChangeRequests: Promise<ClubDelegateChangeRequest[]>;

  @OneToMany(() => ClubDelegateD, clubDelegateD => clubDelegateD.club, {
    lazy: true,
  })
  clubDelegateDs: Promise<ClubDelegateD[]>;

  @OneToMany(() => ClubDivisionT, clubDivisionT => clubDivisionT.club, {
    lazy: true,
  })
  clubDivisionTs: Promise<ClubDivisionT[]>;

  @OneToMany(() => ClubRoomT, clubRoomT => clubRoomT.club, { lazy: true })
  clubRoomTs: Promise<ClubRoomT[]>;

  @OneToMany(() => ClubStudentT, clubStudentT => clubStudentT.club, {
    lazy: true,
  })
  clubStudentTs: Promise<ClubStudentT[]>;

  @OneToMany(() => ClubT, clubT => clubT.club, { lazy: true })
  clubTs: Promise<ClubT[]>;

  @OneToMany(
    () => CommonSpaceUsageOrderD,
    commonSpaceUsageOrderD => commonSpaceUsageOrderD.club,
    { lazy: true },
  )
  commonSpaceUsageOrderDs: Promise<CommonSpaceUsageOrderD[]>;

  @OneToMany(
    () => DivisionPermanentClubD,
    divisionPermanentClubD => divisionPermanentClubD.club,
    { lazy: true },
  )
  divisionPermanentClubDs: Promise<DivisionPermanentClubD[]>;

  @OneToMany(
    () => DivisionPresidentD,
    divisionPresidentD => divisionPresidentD.originatedClub,
    { lazy: true },
  )
  divisionPresidentDs: Promise<DivisionPresidentD[]>;

  @OneToMany(() => Funding, funding => funding.club, { lazy: true })
  fundings: Promise<Funding[]>;

  @OneToMany(
    () => MeetingAttendanceDay,
    meetingAttendanceDay => meetingAttendanceDay.whichClub,
    { lazy: true },
  )
  meetingAttendanceDays: Promise<MeetingAttendanceDay[]>;

  @OneToMany(
    () => ProfessorSignStatus,
    professorSignStatus => professorSignStatus.club,
    { lazy: true },
  )
  professorSignStatuses: Promise<ProfessorSignStatus[]>;

  @OneToMany(
    () => PromotionalPrintingOrder,
    promotionalPrintingOrder => promotionalPrintingOrder.club,
    { lazy: true },
  )
  promotionalPrintingOrders: Promise<PromotionalPrintingOrder[]>;

  @OneToMany(() => Registration, registration => registration.club, {
    lazy: true,
  })
  registrations: Promise<Registration[]>;

  @OneToMany(
    () => RegistrationApplicationStudent,
    registrationApplicationStudent => registrationApplicationStudent.club,
    { lazy: true },
  )
  registrationApplicationStudents: Promise<RegistrationApplicationStudent[]>;

  @OneToMany(() => RentalOrder, rentalOrder => rentalOrder.club, {
    lazy: true,
  })
  rentalOrders: Promise<RentalOrder[]>;
}
