import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Activity } from "./Activity";

@Index("activity_t_activity_id_activity_id_fk", ["activityId"], {})
@Entity("activity_t", { schema: "sparcs-clubs" })
export class ActivityT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "activity_id" })
  activityId: number;

  @Column("datetime", { name: "start_term" })
  startTerm: Date;

  @Column("datetime", { name: "end_term" })
  endTerm: Date;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Activity, activity => activity.activityTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "activity_id", referencedColumnName: "id" }])
  activity: Promise<Activity>;
}
