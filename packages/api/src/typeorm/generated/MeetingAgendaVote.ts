import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { MeetingMapping } from "./MeetingMapping";
import { MeetingVoteChoice } from "./MeetingVoteChoice";
import { MeetingVoteResult } from "./MeetingVoteResult";

@Entity("meeting_agenda_vote", { schema: "sparcs-clubs" })
export class MeetingAgendaVote {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("text", { name: "description" })
  description: string;

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
    meetingMapping => meetingMapping.meetingAgendaVote,
    { lazy: true },
  )
  meetingMappings: Promise<MeetingMapping[]>;

  @OneToMany(
    () => MeetingVoteChoice,
    meetingVoteChoice => meetingVoteChoice.vote,
    { lazy: true },
  )
  meetingVoteChoices: Promise<MeetingVoteChoice[]>;

  @OneToMany(
    () => MeetingVoteResult,
    meetingVoteResult => meetingVoteResult.vote,
    { lazy: true },
  )
  meetingVoteResults: Promise<MeetingVoteResult[]>;
}
