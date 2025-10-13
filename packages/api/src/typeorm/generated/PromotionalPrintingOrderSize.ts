import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("pp_order_size_pp_order_id_fk", ["promotionalPrintingOrderId"], {})
@Index(
  "pp_order_size_pp_size_enum_id_fk",
  ["promotionalPrintingSizeEnumId"],
  {},
)
@Entity("promotional_printing_order_size", { schema: "sparcs-clubs" })
export class PromotionalPrintingOrderSize {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "promotional_printing_order_id" })
  promotionalPrintingOrderId: number;

  @Column("int", { name: "promotional_printing_size_enum_id" })
  promotionalPrintingSizeEnumId: number;

  @Column("int", { name: "number_of_prints" })
  numberOfPrints: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", {
    name: "updated_at",
    nullable: true,
    default: () => "'now()'",
  })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
