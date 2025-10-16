import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { CommonSpace } from "./CommonSpace";
import { Student } from "./Student";

@Index(
  "common_space_usage_order_d_common_space_id_common_space_id_fk",
  ["commonSpaceId"],
  {},
)
@Index("common_space_usage_order_d_club_id_club_id_fk", ["clubId"], {})
@Index(
  "common_space_usage_order_d_charge_student_id_student_id_fk",
  ["chargeStudentId"],
  {},
)
@Entity("common_space_usage_order_d", { schema: "sparcs-clubs" })
export class CommonSpaceUsageOrderD {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "common_space_id" })
  commonSpaceId: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "charge_student_id" })
  chargeStudentId: number;

  @Column("varchar", { name: "student_phone_number", length: 30 })
  studentPhoneNumber: string;

  @Column("datetime", { name: "start_term" })
  startTerm: Date;

  @Column("datetime", { name: "end_term" })
  endTerm: Date;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "updated_at", nullable: true })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Student, student => student.commonSpaceUsageOrderDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "charge_student_id", referencedColumnName: "id" }])
  chargeStudent: Promise<Student>;

  @ManyToOne(() => Club, club => club.commonSpaceUsageOrderDs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(
    () => CommonSpace,
    commonSpace => commonSpace.commonSpaceUsageOrderDs,
    { onDelete: "NO ACTION", onUpdate: "NO ACTION", lazy: true },
  )
  @JoinColumn([{ name: "common_space_id", referencedColumnName: "id" }])
  commonSpace: Promise<CommonSpace>;
}
