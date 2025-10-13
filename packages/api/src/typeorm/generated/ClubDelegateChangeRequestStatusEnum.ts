import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { ClubDelegateChangeRequest } from "./ClubDelegateChangeRequest";

@Entity("club_delegate_change_request_status_enum", { schema: "sparcs-clubs" })
export class ClubDelegateChangeRequestStatusEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "enum_id" })
  enumId: number;

  @Column("varchar", { name: "enum_name", length: 255 })
  enumName: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(
    () => ClubDelegateChangeRequest,
    clubDelegateChangeRequest =>
      clubDelegateChangeRequest.clubDelegateChangeRequestStatusEnum,
    { lazy: true },
  )
  clubDelegateChangeRequests: Promise<ClubDelegateChangeRequest[]>;
}
