import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Funding } from "./Funding";
import { Student } from "./Student";

@Index("transportation_passenger_funding_id_fk", ["fundingId"], {})
@Index("transportation_passenger_student_id_fk", ["studentId"], {})
@Entity("funding_transportation_passenger", { schema: "sparcs-clubs" })
export class FundingTransportationPassenger {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "funding_id" })
  fundingId: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => Funding,
    funding => funding.fundingTransportationPassengers,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "funding_id", referencedColumnName: "id" }])
  funding: Promise<Funding>;

  @ManyToOne(
    () => Student,
    student => student.fundingTransportationPassengers,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
