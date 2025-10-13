import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { SemesterD } from "./SemesterD";

@Index(
  "registration_deadline_d_semester_d_id_semester_d_id_fk",
  ["semesterDId"],
  {},
)
@Entity("registration_deadline_d", { schema: "sparcs-clubs" })
export class RegistrationDeadlineD {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "semester_d_id", nullable: true })
  semesterDId: number | null;

  @Column("int", { name: "registration_deadline_enum_id" })
  registrationDeadlineEnumId: number;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term" })
  endTerm: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => SemesterD, semesterD => semesterD.registrationDeadlineDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "semester_d_id", referencedColumnName: "id" }])
  semesterD: Promise<SemesterD>;
}
