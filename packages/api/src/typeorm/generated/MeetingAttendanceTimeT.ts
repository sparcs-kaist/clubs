import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Meeting } from "./Meeting";
import { User } from "./User";

@Index("meeting_meeting_attendance_time_t_id_fk", ["meetingId"], {})
@Index("user_meeting_attendance_time_t_id_fk", ["userId"], {})
@Entity("meeting_attendance_time_t", { schema: "sparcs-clubs" })
export class MeetingAttendanceTimeT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "meeting_id" })
  meetingId: number;

  @Column("int", { name: "user_id" })
  userId: number;

  @Column("datetime", { name: "start_term" })
  startTerm: Date;

  @Column("datetime", { name: "end_term", nullable: true })
  endTerm: Date | null;

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

  @ManyToOne(() => Meeting, meeting => meeting.meetingAttendanceTimeTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "meeting_id", referencedColumnName: "id" }])
  meeting: Promise<Meeting>;

  @ManyToOne(() => User, user => user.meetingAttendanceTimeTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Promise<User>;

  @ManyToOne(() => Meeting, meeting => meeting.meetingAttendanceTimeTs2, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "meeting_id", referencedColumnName: "id" }])
  meeting_2: Promise<Meeting>;

  @ManyToOne(() => User, user => user.meetingAttendanceTimeTs2, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user_2: Promise<User>;
}
