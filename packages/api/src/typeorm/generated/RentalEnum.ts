import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { RentalObject } from "./RentalObject";

@Entity("rental_enum", { schema: "sparcs-clubs" })
export class RentalEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "type_name", nullable: true, length: 30 })
  typeName: string | null;

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

  @OneToMany(() => RentalObject, rentalObject => rentalObject.rentalEnum2, {
    lazy: true,
  })
  rentalObjects: Promise<RentalObject[]>;
}
