import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ActivityD } from "./ActivityD";
import { ActivityEvidenceFile } from "./ActivityEvidenceFile";
import { ActivityFeedback } from "./ActivityFeedback";
import { ActivityParticipant } from "./ActivityParticipant";
import { ActivityStatusEnum } from "./ActivityStatusEnum";
import { ActivityT } from "./ActivityT";
import { Executive } from "./Executive";
import { Funding } from "./Funding";

@Index("activity_activity_d_id_activity_d_id_fk", ["activityDId"], {})
@Index(
  "activity_activity_status_enum_id_activity_status_enum_id_fk",
  ["activityStatusEnumId"],
  {},
)
@Index(
  "activity_commented_executive_id_executive_id_fk",
  ["commentedExecutiveId"],
  {},
)
@Index("activity_charged_executive_id_fk", ["chargedExecutiveId"], {})
@Entity("activity", { schema: "sparcs-clubs" })
export class Activity {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("varchar", { name: "original_name", length: 255 })
  originalName: string;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("int", { name: "activity_type_enum_id" })
  activityTypeEnumId: number;

  @Column("varchar", { name: "location", length: 255 })
  location: string;

  @Column("text", { name: "purpose" })
  purpose: string;

  @Column("text", { name: "detail" })
  detail: string;

  @Column("text", { name: "evidence" })
  evidence: string;

  @Column("int", { name: "activity_d_id" })
  activityDId: number;

  @Column("int", { name: "activity_status_enum_id" })
  activityStatusEnumId: number;

  @Column("int", { name: "charged_executive_id", nullable: true })
  chargedExecutiveId: number | null;

  @Column("timestamp", { name: "professor_approved_at", nullable: true })
  professorApprovedAt: Date | null;

  @Column("timestamp", { name: "commented_at", nullable: true })
  commentedAt: Date | null;

  @Column("int", { name: "commented_executive_id", nullable: true })
  commentedExecutiveId: number | null;

  @Column("timestamp", { name: "edited_at", default: () => "'now()'" })
  editedAt: Date;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at", default: () => "'now()'" })
  updatedAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => ActivityD, activityD => activityD.activities, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "activity_d_id", referencedColumnName: "id" }])
  activityD: Promise<ActivityD>;

  @ManyToOne(
    () => ActivityStatusEnum,
    activityStatusEnum => activityStatusEnum.activities,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "activity_status_enum_id", referencedColumnName: "id" }])
  activityStatusEnum: Promise<ActivityStatusEnum>;

  @ManyToOne(() => Executive, executive => executive.activities, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "charged_executive_id", referencedColumnName: "id" }])
  chargedExecutive: Promise<Executive>;

  @ManyToOne(() => Executive, executive => executive.activities2, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "charged_executive_id", referencedColumnName: "id" }])
  chargedExecutive_2: Promise<Executive>;

  @ManyToOne(() => Executive, executive => executive.activities3, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "commented_executive_id", referencedColumnName: "id" }])
  commentedExecutive: Promise<Executive>;

  @OneToMany(
    () => ActivityEvidenceFile,
    activityEvidenceFile => activityEvidenceFile.activity,
    { lazy: true },
  )
  activityEvidenceFiles: Promise<ActivityEvidenceFile[]>;

  @OneToMany(
    () => ActivityFeedback,
    activityFeedback => activityFeedback.activity,
    { lazy: true },
  )
  activityFeedbacks: Promise<ActivityFeedback[]>;

  @OneToMany(
    () => ActivityParticipant,
    activityParticipant => activityParticipant.activity,
    { lazy: true },
  )
  activityParticipants: Promise<ActivityParticipant[]>;

  @OneToMany(() => ActivityT, activityT => activityT.activity, { lazy: true })
  activityTs: Promise<ActivityT[]>;

  @OneToMany(() => Funding, funding => funding.purposeActivity, {
    lazy: true,
  })
  fundings: Promise<Funding[]>;
}
