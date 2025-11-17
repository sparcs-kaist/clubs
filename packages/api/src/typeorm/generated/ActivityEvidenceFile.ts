import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Activity } from "./Activity";

@Index("activity_evidence_file_activity_id_fk", ["activityId"], {})
@Entity("activity_evidence_file", { schema: "sparcs-clubs" })
export class ActivityEvidenceFile {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "activity_id" })
  activityId: number;

  @Column("text", { name: "file_id" })
  fileId: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Activity, activity => activity.activityEvidenceFiles, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "activity_id", referencedColumnName: "id" }])
  activity: Promise<Activity>;
}
