import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { RegistrationApplicationStudent } from "./RegistrationApplicationStudent";

@Entity("registration_application_student_status_enum", {
  schema: "sparcs-clubs",
})
export class RegistrationApplicationStudentStatusEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "enum_id" })
  enumId: number;

  @Column("varchar", { name: "enum_name", nullable: true, length: 255 })
  enumName: string | null;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(
    () => RegistrationApplicationStudent,
    registrationApplicationStudent =>
      registrationApplicationStudent.registrationApplicationStudentStatusEnum2,
    { lazy: true },
  )
  registrationApplicationStudents: Promise<RegistrationApplicationStudent[]>;
}
