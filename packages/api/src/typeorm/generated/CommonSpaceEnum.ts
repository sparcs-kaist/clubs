import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { CommonSpace } from "./CommonSpace";

@Entity("common_space_enum", { schema: "sparcs-clubs" })
export class CommonSpaceEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "type_name", length: 30 })
  typeName: string;

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

  @OneToMany(() => CommonSpace, commonSpace => commonSpace.commonSpaceEnum2, {
    lazy: true,
  })
  commonSpaces: Promise<CommonSpace[]>;
}
