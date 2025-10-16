import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { MeetingAnnouncement } from "./MeetingAnnouncement";
import { MeetingAttendanceDay } from "./MeetingAttendanceDay";
import { MeetingAttendanceTimeT } from "./MeetingAttendanceTimeT";
import { MeetingMapping } from "./MeetingMapping";

@Index("meeting_announcement_id_fk", ["meetingAnnouncementId"], {})
@Entity("meeting", { schema: "sparcs-clubs" })
export class Meeting {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "meeting_announcement_id", nullable: true })
  meetingAnnouncementId: number | null;

  @Column("int", { name: "meeting_type_enum" })
  meetingTypeEnum: number;

  @Column("tinyint", { name: "is_regular_meeting", width: 1 })
  isRegularMeeting: boolean;

  @Column("varchar", { name: "location_kr", nullable: true, length: 255 })
  locationKr: string | null;

  @Column("varchar", { name: "location_en", nullable: true, length: 255 })
  locationEn: string | null;

  @Column("datetime", { name: "start_datetime" })
  startDatetime: Date;

  @Column("datetime", { name: "end_datetime", nullable: true })
  endDatetime: Date | null;

  @Column("varchar", { name: "meeting_group_tag", length: 255 })
  meetingGroupTag: string;

  @Column("int", { name: "meeting_status_enum", default: () => "'1'" })
  meetingStatusEnum: number;

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
    () => MeetingAnnouncement,
    meetingAnnouncement => meetingAnnouncement.meetings,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "meeting_announcement_id", referencedColumnName: "id" }])
  meetingAnnouncement: Promise<MeetingAnnouncement>;

  @OneToMany(
    () => MeetingAttendanceDay,
    meetingAttendanceDay => meetingAttendanceDay.meeting,
    { lazy: true },
  )
  meetingAttendanceDays: Promise<MeetingAttendanceDay[]>;

  @OneToMany(
    () => MeetingAttendanceTimeT,
    meetingAttendanceTimeT => meetingAttendanceTimeT.meeting,
    { lazy: true },
  )
  meetingAttendanceTimeTs: Promise<MeetingAttendanceTimeT[]>;

  @OneToMany(
    () => MeetingAttendanceTimeT,
    meetingAttendanceTimeT => meetingAttendanceTimeT.meeting_2,
    { lazy: true },
  )
  meetingAttendanceTimeTs2: Promise<MeetingAttendanceTimeT[]>;

  @OneToMany(() => MeetingMapping, meetingMapping => meetingMapping.meeting, {
    lazy: true,
  })
  meetingMappings: Promise<MeetingMapping[]>;
}
