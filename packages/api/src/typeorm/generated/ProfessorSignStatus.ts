import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { SemesterD } from "./SemesterD";

@Index("professor_sign_status_club_id_fk", ["clubId"], {})
@Index("professor_sign_status_semester_id_fk", ["semesterId"], {})
@Entity("professor_sign_status", { schema: "sparcs-clubs" })
export class ProfessorSignStatus {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "semester_id" })
  semesterId: number;

  @Column("tinyint", { name: "signed", width: 1, default: () => "'0'" })
  signed: boolean;

  @Column("timestamp", { name: "created_at", default: () => "'now()'" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at", default: () => "'now()'" })
  updatedAt: Date;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Club, club => club.professorSignStatuses, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => SemesterD, semesterD => semesterD.professorSignStatuses, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "semester_id", referencedColumnName: "id" }])
  semester: Promise<SemesterD>;
}
