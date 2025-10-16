import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("club_delegate_enum", { schema: "sparcs-clubs" })
export class ClubDelegateEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "enum_name", nullable: true, length: 255 })
  enumName: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
