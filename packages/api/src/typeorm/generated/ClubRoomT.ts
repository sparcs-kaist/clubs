import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { ClubBuildingEnum } from "./ClubBuildingEnum";
import { SemesterD } from "./SemesterD";

@Index("club_room_t_club_id_club_id_fk", ["clubId"], {})
@Index(
  "club_room_t_club_building_enum_club_building_enum_id_fk",
  ["clubBuildingEnum"],
  {},
)
@Index("club_room_t_semester_id_semester_d_id_fk", ["semesterId"], {})
@Entity("club_room_t", { schema: "sparcs-clubs" })
export class ClubRoomT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "club_building_enum" })
  clubBuildingEnum: number;

  @Column("varchar", { name: "room_location", nullable: true, length: 20 })
  roomLocation: string | null;

  @Column("varchar", { name: "room_password", nullable: true, length: 20 })
  roomPassword: string | null;

  @Column("int", { name: "semester_id" })
  semesterId: number;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term", nullable: true })
  endTerm: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => ClubBuildingEnum,
    clubBuildingEnum => clubBuildingEnum.clubRoomTs,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "club_building_enum", referencedColumnName: "id" }])
  clubBuildingEnum2: Promise<ClubBuildingEnum>;

  @ManyToOne(() => Club, club => club.clubRoomTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => SemesterD, semesterD => semesterD.clubRoomTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "semester_id", referencedColumnName: "id" }])
  semester: Promise<SemesterD>;
}
