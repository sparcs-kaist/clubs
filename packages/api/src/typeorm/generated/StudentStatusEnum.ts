import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("student_status_enum", { schema: "sparcs-clubs" })
export class StudentStatusEnum {
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
}
