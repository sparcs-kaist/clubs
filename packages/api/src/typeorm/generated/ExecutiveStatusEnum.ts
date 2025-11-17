import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { ExecutiveT } from "./ExecutiveT";

@Entity("executive_status_enum", { schema: "sparcs-clubs" })
export class ExecutiveStatusEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", nullable: true, length: 30 })
  name: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => ExecutiveT, executiveT => executiveT.executiveStatusEnum2, {
    lazy: true,
  })
  executiveTs: Promise<ExecutiveT[]>;
}
