import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { RentalOrderItemD } from "./RentalOrderItemD";
import { Student } from "./Student";

@Index("rental_order_student_id_student_id_fk", ["studentId"], {})
@Index("rental_order_club_id_club_id_fk", ["clubId"], {})
@Entity("rental_order", { schema: "sparcs-clubs" })
export class RentalOrder {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "student_id" })
  studentId: number;

  @Column("varchar", {
    name: "student_phone_number",
    nullable: true,
    length: 30,
  })
  studentPhoneNumber: string | null;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("text", { name: "purpose", nullable: true })
  purpose: string | null;

  @Column("datetime", { name: "desired_start" })
  desiredStart: Date;

  @Column("datetime", { name: "desired_end" })
  desiredEnd: Date;

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

  @ManyToOne(() => Club, club => club.rentalOrders, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => Student, student => student.rentalOrders, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "student_id", referencedColumnName: "id" }])
  student: Promise<Student>;

  @OneToMany(
    () => RentalOrderItemD,
    rentalOrderItemD => rentalOrderItemD.rentalOrder,
    { lazy: true },
  )
  rentalOrderItemDs: Promise<RentalOrderItemD[]>;
}
