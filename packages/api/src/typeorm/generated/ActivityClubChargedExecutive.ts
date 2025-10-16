import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ActivityD } from "./ActivityD";
import { Club } from "./Club";
import { Executive } from "./Executive";

@Index("activity_club_charged_executive_activity_d_id_fk", ["activityDId"], {})
@Index("activity_club_charged_executive_club_id_fk", ["clubId"], {})
@Index("activity_club_charged_executive_executive_id_fk", ["executiveId"], {})
@Entity("activity_club_charged_executive", { schema: "sparcs-clubs" })
export class ActivityClubChargedExecutive {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "activity_d_id" })
  activityDId: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "executive_id", nullable: true })
  executiveId: number | null;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => ActivityD,
    activityD => activityD.activityClubChargedExecutives,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "activity_d_id", referencedColumnName: "id" }])
  activityD: Promise<ActivityD>;

  @ManyToOne(() => Club, club => club.activityClubChargedExecutives, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(
    () => Executive,
    executive => executive.activityClubChargedExecutives,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "executive_id", referencedColumnName: "id" }])
  executive: Promise<Executive>;
}
