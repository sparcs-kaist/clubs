import { Column, Entity, OneToMany } from "typeorm";

import { MeetingAttendanceDay } from "./MeetingAttendanceDay";

@Entity("meeting_role_enum", { schema: "sparcs-clubs" })
export class MeetingRoleEnum {
  @Column("int", { primary: true, name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 30 })
  name: string;

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

  @OneToMany(
    () => MeetingAttendanceDay,
    meetingAttendanceDay => meetingAttendanceDay.meetingRoleEnum2,
    { lazy: true },
  )
  meetingAttendanceDays: Promise<MeetingAttendanceDay[]>;
}
