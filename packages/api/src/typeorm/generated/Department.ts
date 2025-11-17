import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("department_department_id_unique", ["departmentId"], { unique: true })
@Entity("department", { schema: "sparcs-clubs" })
export class Department {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "department_id", nullable: true, unique: true })
  departmentId: number | null;

  @Column("varchar", { name: "name", length: 255 })
  name: string;

  @Column("varchar", { name: "name_en", nullable: true, length: 255 })
  nameEn: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
