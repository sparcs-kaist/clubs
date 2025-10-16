import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Club } from "./Club";
import { ClubStatusEnum } from "./ClubStatusEnum";
import { Professor } from "./Professor";
import { SemesterD } from "./SemesterD";

@Index("club_t_club_id_club_id_fk", ["clubId"], {})
@Index(
  "club_t_club_status_enum_id_club_status_enum_id_fk",
  ["clubStatusEnumId"],
  {},
)
@Index("club_t_professor_id_professor_id_fk", ["professorId"], {})
@Index("club_t_semester_id_semester_d_id_fk", ["semesterId"], {})
@Entity("club_t", { schema: "sparcs-clubs" })
export class ClubT {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "club_id" })
  clubId: number;

  @Column("int", { name: "club_status_enum_id" })
  clubStatusEnumId: number;

  @Column("varchar", { name: "characteristic_kr", nullable: true, length: 255 })
  characteristicKr: string | null;

  @Column("varchar", { name: "characteristic_en", nullable: true, length: 255 })
  characteristicEn: string | null;

  @Column("int", { name: "professor_id", nullable: true })
  professorId: number | null;

  @Column("int", { name: "semester_id" })
  semesterId: number;

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

  @ManyToOne(() => Club, club => club.clubTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_id", referencedColumnName: "id" }])
  club: Promise<Club>;

  @ManyToOne(() => ClubStatusEnum, clubStatusEnum => clubStatusEnum.clubTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "club_status_enum_id", referencedColumnName: "id" }])
  clubStatusEnum: Promise<ClubStatusEnum>;

  @ManyToOne(() => Professor, professor => professor.clubTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "professor_id", referencedColumnName: "id" }])
  professor: Promise<Professor>;

  @ManyToOne(() => SemesterD, semesterD => semesterD.clubTs, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "semester_id", referencedColumnName: "id" }])
  semester: Promise<SemesterD>;
}
