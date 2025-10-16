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
import { Meeting } from "./Meeting";
import { MeetingRoleEnum } from "./MeetingRoleEnum";

@Index("meeting_attendance_day_which_club_id_club_id_fk", ["whichClubId"], {})
@Index(
  "meeting_attendance_day_which_division_id_division_id_fk",
  ["whichDivisionId"],
  {},
)
@Index("meeting_meeting_attendance_day_id_fk", ["meetingId"], {})
@Index("meeting_attendance_day_role_enum_fk", ["meetingRoleEnum"], {})
@Entity("meeting_attendance_day", { schema: "sparcs-clubs" })
export class MeetingAttendanceDay {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "meeting_id" })
  meetingId: number;

  @Column("int", { name: "meeting_role_enum" })
  meetingRoleEnum: number;

  @Column("int", { name: "which_club_id", nullable: true })
  whichClubId: number | null;

  @Column("int", { name: "which_division_id", nullable: true })
  whichDivisionId: number | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", {
    name: "updated_at",
    nullable: true,
    default: () => "'now()'",
  })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => MeetingRoleEnum,
    meetingRoleEnum => meetingRoleEnum.meetingAttendanceDays,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "meeting_role_enum", referencedColumnName: "id" }])
  meetingRoleEnum2: Promise<MeetingRoleEnum>;

  @ManyToOne(() => Club, club => club.meetingAttendanceDays, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "which_club_id", referencedColumnName: "id" }])
  whichClub: Promise<Club>;

  @ManyToOne(() => Division, division => division.meetingAttendanceDays, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "which_division_id", referencedColumnName: "id" }])
  whichDivision: Promise<Division>;

  @ManyToOne(() => Meeting, meeting => meeting.meetingAttendanceDays, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "meeting_id", referencedColumnName: "id" }])
  meeting: Promise<Meeting>;
}
