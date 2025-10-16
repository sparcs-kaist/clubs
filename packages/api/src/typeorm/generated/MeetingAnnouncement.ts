import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { Meeting } from "./Meeting";

@Entity("meeting_announcement", { schema: "sparcs-clubs" })
export class MeetingAnnouncement {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("text", { name: "content" })
  content: string;

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

  @OneToMany(() => Meeting, meeting => meeting.meetingAnnouncement, {
    lazy: true,
  })
  meetings: Promise<Meeting[]>;
}
