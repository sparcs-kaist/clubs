import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Employee } from "./Employee";

@Index("employee_t_employee_id_unique", ["employeeId"], { unique: true })
@Entity("employee_t", { schema: "sparcs-clubs" })
export class EmployeeT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "employee_id", unique: true })
  employeeId: number;

  @Column("date", { name: "start_term" })
  startTerm: string;

  @Column("date", { name: "end_term", nullable: true })
  endTerm: string | null;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => Employee, employee => employee.employeeT, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "employee_id", referencedColumnName: "id" }])
  employee: Promise<Employee>;
}
