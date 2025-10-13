import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { ClubRoomT } from "./ClubRoomT";

@Entity("club_building_enum", { schema: "sparcs-clubs" })
export class ClubBuildingEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "building_name", nullable: true, length: 30 })
  buildingName: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => ClubRoomT, clubRoomT => clubRoomT.clubBuildingEnum2, {
    lazy: true,
  })
  clubRoomTs: Promise<ClubRoomT[]>;
}
