import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export default class ClubTRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(private readonly prisma: PrismaService) {}

  async findClubTById(clubId: number) {
    const crt = this.clock.now();
    const result = await this.prisma.clubT.findFirst({
      where: {
        clubId,
        OR: [
          { AND: [{ endTerm: null }, { endTerm: { lte: crt } }] },
          { endTerm: { gte: crt } },
        ],
      },
    });
    return result;
  }

  async findClubDetail(semesterId: number, clubId: number) {
    const result = await this.prisma.$queryRaw<
      Array<{
        clubStatusEnumId: number;
        characteristicKr: string | null;
        professorId: number | null;
        professorName: string | null;
      }>
    >(Prisma.sql`
      SELECT ct.club_status_enum_id AS clubStatusEnumId,
             ct.characteristic_kr AS characteristicKr,
             ct.professor_id AS professorId,
             p.name AS professorName
      FROM club_t ct
      LEFT JOIN professor p ON p.id = ct.professor_id
      WHERE ct.semester_id = ${semesterId} AND ct.club_id = ${clubId}
    `);
    const row = result[0];
    return {
      clubStatusEnumId: row?.clubStatusEnumId,
      characteristicKr: row?.characteristicKr,
      advisor: row?.professorId ? row.professorName : null,
    };
  }

  async findClubById(clubId: number): Promise<boolean> {
    const crt = this.clock.now();
    const result = await this.prisma.clubT.findFirst({
      where: {
        clubId,
        OR: [
          { AND: [{ endTerm: null }, { endTerm: { lte: crt } }] },
          { endTerm: { gte: crt } },
        ],
      },
      select: { clubId: true },
    });
    return !!result;
  }

  async findSemesterByClubId(clubId: number) {
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        year: number;
        startTerm: Date;
        endTerm: Date;
      }>
    >(Prisma.sql`
      SELECT sd.id, sd.name, sd.year, sd.start_term AS startTerm, sd.end_term AS endTerm
      FROM semester_d sd
      INNER JOIN club_t ct ON sd.id = ct.semester_id
      WHERE ct.club_id = ${clubId} AND ct.deleted_at IS NULL
      ORDER BY sd.id DESC
    `);
    return result.map(row => ({
      id: row.id,
      year: row.year,
      name: row.name,
      startTerm: row.startTerm,
      endTerm: row.endTerm,
    }));
  }

  async findProfessorSemester(professorId: number) {
    const result = await this.prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        year: number;
        startTerm: Date;
        endTerm: Date;
        clubId: number;
      }>
    >(Prisma.sql`
      SELECT sd.id, sd.name, sd.year, sd.start_term AS startTerm,
             sd.end_term AS endTerm, ct.club_id AS clubId
      FROM club_t ct
      LEFT JOIN semester_d sd ON sd.id = ct.semester_id
      WHERE ct.professor_id = ${professorId}
      ORDER BY sd.id DESC
    `);
    return result.map(row => ({
      id: row.id,
      name: `${row.year} ${row.name}`,
      startTerm: row.startTerm,
      endTerm: row.endTerm,
      clubs: [{ id: row.clubId }],
    }));
  }

  async selectBySemesterId(semesterId: number) {
    return this.prisma.clubT.findMany({
      where: { semesterId, deletedAt: null },
    });
  }

  async findByClubIdAndSemesterId(clubId: number, semesterId: number) {
    return this.prisma.clubT.findFirst({
      where: { clubId, semesterId, deletedAt: null },
    });
  }
}
