import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Meeting } from "./Meeting";
import { MeetingAgenda } from "./MeetingAgenda";
import { MeetingAgendaContent } from "./MeetingAgendaContent";
import { MeetingAgendaVote } from "./MeetingAgendaVote";

@Index("meeting_meeting_mapping_id_fk", ["meetingId"], {})
@Index("meeting_agenda_meeting_mapping_id_fk", ["meetingAgendaId"], {})
@Index(
  "meeting_agenda_content_meeting_mapping_id_fk",
  ["meetingAgendaContentId"],
  {},
)
@Index("meeting_agenda_vote_meeting_mapping_id_fk", ["meetingAgendaVoteId"], {})
@Entity("meeting_mapping", { schema: "sparcs-clubs" })
export class MeetingMapping {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "meeting_id" })
  meetingId: number;

  @Column("int", { name: "meeting_agenda_id" })
  meetingAgendaId: number;

  @Column("int", { name: "meeting_agenda_position" })
  meetingAgendaPosition: number;

  @Column("int", { name: "meeting_agenda_entity_type" })
  meetingAgendaEntityType: number;

  @Column("int", { name: "meeting_agenda_content_id", nullable: true })
  meetingAgendaContentId: number | null;

  @Column("int", { name: "meeting_agenda_vote_id", nullable: true })
  meetingAgendaVoteId: number | null;

  @Column("int", { name: "meeting_agenda_entity_position", nullable: true })
  meetingAgendaEntityPosition: number | null;

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
    () => MeetingAgendaContent,
    meetingAgendaContent => meetingAgendaContent.meetingMappings,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([
    { name: "meeting_agenda_content_id", referencedColumnName: "id" },
  ])
  meetingAgendaContent: Promise<MeetingAgendaContent>;

  @ManyToOne(
    () => MeetingAgenda,
    meetingAgenda => meetingAgenda.meetingMappings,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "meeting_agenda_id", referencedColumnName: "id" }])
  meetingAgenda: Promise<MeetingAgenda>;

  @ManyToOne(
    () => MeetingAgendaVote,
    meetingAgendaVote => meetingAgendaVote.meetingMappings,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "meeting_agenda_vote_id", referencedColumnName: "id" }])
  meetingAgendaVote: Promise<MeetingAgendaVote>;

  @ManyToOne(() => Meeting, meeting => meeting.meetingMappings, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "meeting_id", referencedColumnName: "id" }])
  meeting: Promise<Meeting>;
}
