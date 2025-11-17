import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Activity } from "./Activity";
import { Executive } from "./Executive";

@Index("activity_feedback_activity_id_activity_id_fk", ["activityId"], {})
@Index("activity_feedback_executive_id_executive_id_fk", ["executiveId"], {})
@Entity("activity_feedback", { schema: "sparcs-clubs" })
export class ActivityFeedback {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "activity_id" })
  activityId: number;

  @Column("int", { name: "executive_id" })
  executiveId: number;

  @Column("text", { name: "comment" })
  comment: string;

  @Column("int", { name: "activity_status_enum" })
  activityStatusEnum: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Activity, activity => activity.activityFeedbacks, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "activity_id", referencedColumnName: "id" }])
  activity: Promise<Activity>;

  @ManyToOne(() => Executive, executive => executive.activityFeedbacks, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "executive_id", referencedColumnName: "id" }])
  executive: Promise<Executive>;
}
