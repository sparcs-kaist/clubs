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
import { ClubDivisionT } from "./ClubDivisionT";
import { District } from "./District";
import { DivisionPresidentD } from "./DivisionPresidentD";
import { MeetingAttendanceDay } from "./MeetingAttendanceDay";
import { Registration } from "./Registration";

@Index("division_district_id_district_id_fk", ["districtId"], {})
@Entity("division", { schema: "sparcs-clubs" })
export class Division {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "name", length: 10 })
  name: string;

  @Column("date", { name: "start_term", default: () => "'2017-03-01'" })
  startTerm: string;

  @Column("date", { name: "end_term", nullable: true })
  endTerm: string | null;

  @Column("int", { name: "district_id" })
  districtId: number;

  @Column("timestamp", {
    name: "created_at",
    nullable: true,
    default: () => "'now()'",
  })
  createdAt: Date | null;

  @Column("timestamp", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Club, club => club.division, { lazy: true })
  clubs: Promise<Club[]>;

  @OneToMany(() => ClubDivisionT, clubDivisionT => clubDivisionT.division, {
    lazy: true,
  })
  clubDivisionTs: Promise<ClubDivisionT[]>;

  @ManyToOne(() => District, district => district.divisions, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
    lazy: true,
  })
  @JoinColumn([{ name: "district_id", referencedColumnName: "id" }])
  district: Promise<District>;

  @OneToMany(
    () => DivisionPresidentD,
    divisionPresidentD => divisionPresidentD.division,
    { lazy: true },
  )
  divisionPresidentDs: Promise<DivisionPresidentD[]>;

  @OneToMany(
    () => MeetingAttendanceDay,
    meetingAttendanceDay => meetingAttendanceDay.whichDivision,
    { lazy: true },
  )
  meetingAttendanceDays: Promise<MeetingAttendanceDay[]>;

  @OneToMany(() => Registration, registration => registration.division, {
    lazy: true,
  })
  registrations: Promise<Registration[]>;
}
