import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { Registration } from "./Registration";

@Entity("registration_type_enum", { schema: "sparcs-clubs" })
export class RegistrationTypeEnum {
  @PrimaryGeneratedColumn({ type: "int", name: "enum_id" })
  enumId: number;

  @Column("varchar", { name: "enum_name", length: 30 })
  enumName: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(
    () => Registration,
    registration => registration.registrationApplicationTypeEnum,
    { lazy: true },
  )
  registrations: Promise<Registration[]>;
}
