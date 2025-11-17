import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { MeetingAgendaVote } from "./MeetingAgendaVote";
import { MeetingVoteResult } from "./MeetingVoteResult";

@Index("meeting_agenda_vote_choice_id_fk", ["voteId"], {})
@Entity("meeting_vote_choice", { schema: "sparcs-clubs" })
export class MeetingVoteChoice {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "vote_id" })
  voteId: number;

  @Column("varchar", { name: "choice", length: 255 })
  choice: string;

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
    () => MeetingAgendaVote,
    meetingAgendaVote => meetingAgendaVote.meetingVoteChoices,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "vote_id", referencedColumnName: "id" }])
  vote: Promise<MeetingAgendaVote>;

  @OneToMany(
    () => MeetingVoteResult,
    meetingVoteResult => meetingVoteResult.choice,
    { lazy: true },
  )
  meetingVoteResults: Promise<MeetingVoteResult[]>;
}
