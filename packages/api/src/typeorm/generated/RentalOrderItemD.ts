import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { RentalObject } from "./RentalObject";
import { RentalOrder } from "./RentalOrder";

@Index(
  "rental_order_item_d_rental_order_id_rental_order_id_fk",
  ["rentalOrderId"],
  {},
)
@Index("rental_order_item_d_object_id_rental_object_id_fk", ["objectId"], {})
@Entity("rental_order_item_d", { schema: "sparcs-clubs" })
export class RentalOrderItemD {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "rental_order_id" })
  rentalOrderId: number;

  @Column("int", { name: "object_id" })
  objectId: number;

  @Column("datetime", { name: "start_term", nullable: true })
  startTerm: Date | null;

  @Column("datetime", { name: "end_term", nullable: true })
  endTerm: Date | null;

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

  @ManyToOne(
    () => RentalObject,
    rentalObject => rentalObject.rentalOrderItemDs,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "object_id", referencedColumnName: "id" }])
  object: Promise<RentalObject>;

  @ManyToOne(() => RentalOrder, rentalOrder => rentalOrder.rentalOrderItemDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "rental_order_id", referencedColumnName: "id" }])
  rentalOrder: Promise<RentalOrder>;
}
