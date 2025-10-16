import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("activity_type_enum", { schema: "sparcs-clubs" })
export class ActivityTypeEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "type_name", length: 255 })
  typeName: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
