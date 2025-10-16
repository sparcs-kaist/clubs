import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { Student } from "./Student";

@Index(
  "pp_order_pp_order_status_enum_id_fk",
  ["promotionalPrintingOrderStatusEnum"],
  {},
)
@Index("promotional_printing_order_club_id_club_id_fk", ["clubId"], {})
@Index("promotional_printing_order_student_id_student_id_fk", ["studentId"], {})
@Entity("promotional_printing_order", { schema: "sparcs-clubs" })
export class PromotionalPrintingOrder {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("varchar", {
    name: "student_phone_number",
    nullable: true,
    length: 30,
  })
  studentPhoneNumber: string | null;

  @Column("int", { name: "promotional_printing_order_status_enum" })
  promotionalPrintingOrderStatusEnum: number;

  @Column("text", { name: "document_file_link", nullable: true })
  documentFileLink: string | null;

  @Column("tinyint", { name: "is_color_print", width: 1, default: () => "'1'" })
  isColorPrint: boolean;

  @Column("tinyint", {
    name: "fit_print_size_to_paper",
    width: 1,
    default: () => "'1'",
  })
  fitPrintSizeToPaper: boolean;

  @Column("tinyint", {
    name: "require_margin_chopping",
    width: 1,
    default: () => "'0'",
  })
  requireMarginChopping: boolean;

  @Column("datetime", { name: "desired_pick_up_time" })
  desiredPickUpTime: Date;

  @Column("datetime", { name: "pick_up_at", nullable: true })
  pickUpAt: Date | null;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", {
    name: "updated_at",
    nullable: true,
    default: () => "'now()'",
  })
  updatedAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Club, club => club.promotionalPrintingOrders, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => Student, student => student.promotionalPrintingOrders, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;
}
