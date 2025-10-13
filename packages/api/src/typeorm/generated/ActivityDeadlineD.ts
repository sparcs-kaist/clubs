import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("activity_deadline_d", { schema: "sparcs-clubs" })
export class ActivityDeadlineD {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "semester_id" })
  semesterId: number;

  @Column("int", { name: "deadline_enum_id" })
  deadlineEnumId: number;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term" })
  endTerm: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;
}
