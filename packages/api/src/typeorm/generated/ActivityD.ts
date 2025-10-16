import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { Activity } from "./Activity";
import { ActivityClubChargedExecutive } from "./ActivityClubChargedExecutive";
import { Funding } from "./Funding";

@Entity("activity_d", { schema: "sparcs-clubs" })
export class ActivityD {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "semester_id" })
  semesterId: number;

  @Column("int", { name: "year" })
  year: number;

  @Column("varchar", { name: "name", length: 10 })
  name: string;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term" })
  endTerm: string;

  @Column("int", { name: "activity_duration_type_enum" })
  activityDurationTypeEnum: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Activity, activity => activity.activityD, { lazy: true })
  activities: Promise<Activity[]>;

  @OneToMany(
    () => ActivityClubChargedExecutive,
    activityClubChargedExecutive => activityClubChargedExecutive.activityD,
    { lazy: true },
  )
  activityClubChargedExecutives: Promise<ActivityClubChargedExecutive[]>;

  @OneToMany(() => Funding, funding => funding.activityD, { lazy: true })
  fundings: Promise<Funding[]>;
}
