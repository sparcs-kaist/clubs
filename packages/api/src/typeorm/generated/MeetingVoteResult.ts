import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { MeetingAgendaVote } from "./MeetingAgendaVote";
import { MeetingVoteChoice } from "./MeetingVoteChoice";
import { User } from "./User";

@Index("meeting_agenda_vote_result_id_fk", ["voteId"], {})
@Index("user_meeting_vote_result_id_fk", ["userId"], {})
@Index("meeting_vote_choice_result_id_fk", ["choiceId"], {})
@Entity("meeting_vote_result", { schema: "sparcs-clubs" })
export class MeetingVoteResult {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "vote_id" })
  voteId: number;

  @Column("int", { name: "user_id" })
  userId: number;

  @Column("int", { name: "choice_id" })
  choiceId: number;

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
    meetingAgendaVote => meetingAgendaVote.meetingVoteResults,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "vote_id", referencedColumnName: "id" }])
  vote: Promise<MeetingAgendaVote>;

  @ManyToOne(
    () => MeetingVoteChoice,
    meetingVoteChoice => meetingVoteChoice.meetingVoteResults,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "choice_id", referencedColumnName: "id" }])
  choice: Promise<MeetingVoteChoice>;

  @ManyToOne(() => User, user => user.meetingVoteResults, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "user_id", referencedColumnName: "id" }])
  user: Promise<User>;
}
