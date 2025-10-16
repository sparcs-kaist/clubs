import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { RentalEnum } from "./RentalEnum";
import { RentalOrderItemD } from "./RentalOrderItemD";

@Index("rental_object_rental_enum_rental_enum_id_fk", ["rentalEnum"], {})
@Entity("rental_object", { schema: "sparcs-clubs" })
export class RentalObject {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "rental_enum" })
  rentalEnum: number;

  @Column("varchar", { name: "object_name", nullable: true, length: 30 })
  objectName: string | null;

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

  @ManyToOne(() => RentalEnum, rentalEnum => rentalEnum.rentalObjects, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "rental_enum", referencedColumnName: "id" }])
  rentalEnum2: Promise<RentalEnum>;

  @OneToMany(
    () => RentalOrderItemD,
    rentalOrderItemD => rentalOrderItemD.object,
    { lazy: true },
  )
  rentalOrderItemDs: Promise<RentalOrderItemD[]>;
}
