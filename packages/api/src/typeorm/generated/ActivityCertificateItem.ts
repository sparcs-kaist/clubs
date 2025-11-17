import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index(
  "activity_certificate_id_d_activity_certificate_id_enum_id_fk",
  ["activityCertificateId"],
  {},
)
@Entity("activity_certificate_item", { schema: "sparcs-clubs" })
export class ActivityCertificateItem {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "activity_certificate_id" })
  activityCertificateId: number;

  @Column("int", { name: "order" })
  order: number;

  @Column("date", { name: "start_month" })
  startMonth: string;

  @Column("date", { name: "end_month" })
  endMonth: string;

  @Column("varchar", { name: "detail", nullable: true, length: 100 })
  detail: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
