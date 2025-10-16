import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { Division } from "./Division";

@Entity("district", { schema: "sparcs-clubs" })
export class District {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 10 })
  name: string;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Division, division => division.district, { lazy: true })
  divisions: Promise<Division[]>;
}
