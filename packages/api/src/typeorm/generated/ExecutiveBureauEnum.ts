import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { ExecutiveT } from "./ExecutiveT";

@Entity("executive_bureau_enum", { schema: "sparcs-clubs" })
export class ExecutiveBureauEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", nullable: true, length: 31 })
  name: string | null;

  @OneToMany(() => ExecutiveT, executiveT => executiveT.executiveBureauEnum2, {
    lazy: true,
  })
  executiveTs: Promise<ExecutiveT[]>;
}
