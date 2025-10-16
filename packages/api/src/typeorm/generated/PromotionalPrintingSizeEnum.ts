import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("promotional_printing_size_enum", { schema: "sparcs-clubs" })
export class PromotionalPrintingSizeEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "printing_size", nullable: true, length: 30 })
  printingSize: string | null;

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
