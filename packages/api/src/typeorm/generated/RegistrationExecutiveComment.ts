import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Executive } from "./Executive";
import { Registration } from "./Registration";

@Index(
  "registration_executive_comment_registration_id_fk",
  ["registrationId"],
  {},
)
@Index("registration_executive_comment_executive_id_fk", ["executiveId"], {})
@Entity("registration_executive_comment", { schema: "sparcs-clubs" })
export class RegistrationExecutiveComment {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "registration_id" })
  registrationId: number;

  @Column("int", { name: "executive_id" })
  executiveId: number;

  @Column("text", { name: "content" })
  content: string;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => Executive,
    executive => executive.registrationExecutiveComments,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "executive_id", referencedColumnName: "id" }])
  executive: Promise<Executive>;

  @ManyToOne(
    () => Registration,
    registration => registration.registrationExecutiveComments,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "registration_id", referencedColumnName: "id" }])
  registration: Promise<Registration>;
}
