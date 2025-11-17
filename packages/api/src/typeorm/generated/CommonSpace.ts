import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { CommonSpaceEnum } from "./CommonSpaceEnum";
import { CommonSpaceUsageOrderD } from "./CommonSpaceUsageOrderD";

@Index(
  "common_space_common_space_enum_common_space_enum_id_fk",
  ["commonSpaceEnum"],
  {},
)
@Entity("common_space", { schema: "sparcs-clubs" })
export class CommonSpace {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "common_space_enum" })
  commonSpaceEnum: number;

  @Column("int", { name: "available_hours_per_week" })
  availableHoursPerWeek: number;

  @Column("int", { name: "available_hours_per_day" })
  availableHoursPerDay: number;

  @Column("varchar", { name: "space_name", length: 30 })
  spaceName: string;

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
    () => CommonSpaceEnum,
    commonSpaceEnum => commonSpaceEnum.commonSpaces,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "common_space_enum", referencedColumnName: "id" }])
  commonSpaceEnum2: Promise<CommonSpaceEnum>;

  @OneToMany(
    () => CommonSpaceUsageOrderD,
    commonSpaceUsageOrderD => commonSpaceUsageOrderD.commonSpace,
    { lazy: true },
  )
  commonSpaceUsageOrderDs: Promise<CommonSpaceUsageOrderD[]>;
}
