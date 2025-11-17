import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { Activity } from "./Activity";

@Entity("activity_status_enum", { schema: "sparcs-clubs" })
export class ActivityStatusEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "status_name", length: 255 })
  statusName: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Activity, activity => activity.activityStatusEnum, {
    lazy: true,
  })
  activities: Promise<Activity[]>;
}
