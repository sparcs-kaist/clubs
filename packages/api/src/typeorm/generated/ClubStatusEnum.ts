import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { ClubT } from "./ClubT";

@Entity("club_status_enum", { schema: "sparcs-clubs" })
export class ClubStatusEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "status_name", nullable: true, length: 30 })
  statusName: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => ClubT, clubT => clubT.clubStatusEnum, { lazy: true })
  clubTs: Promise<ClubT[]>;
}
