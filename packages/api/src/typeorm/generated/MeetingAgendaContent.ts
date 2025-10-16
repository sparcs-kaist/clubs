import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { MeetingMapping } from "./MeetingMapping";

@Entity("meeting_agenda_content", { schema: "sparcs-clubs" })
export class MeetingAgendaContent {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

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

  @OneToMany(
    () => MeetingMapping,
    meetingMapping => meetingMapping.meetingAgendaContent,
    { lazy: true },
  )
  meetingMappings: Promise<MeetingMapping[]>;
}
