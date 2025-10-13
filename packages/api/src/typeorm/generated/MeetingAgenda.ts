import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { MeetingMapping } from "./MeetingMapping";

@Entity("meeting_agenda", { schema: "sparcs-clubs" })
export class MeetingAgenda {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "enum" })
  enum: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("text", { name: "description" })
  description: string;

  @Column("tinyint", { name: "is_editable_divisionPresident", width: 1 })
  isEditableDivisionPresident: boolean;

  @Column("tinyint", { name: "is_editable_representative", width: 1 })
  isEditableRepresentative: boolean;

  @Column("tinyint", { name: "is_editable_self", width: 1 })
  isEditableSelf: boolean;

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
    meetingMapping => meetingMapping.meetingAgenda,
    { lazy: true },
  )
  meetingMappings: Promise<MeetingMapping[]>;
}
