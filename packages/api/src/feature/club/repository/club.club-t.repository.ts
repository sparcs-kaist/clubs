import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import { DrizzleAsyncProvider } from "src/drizzle/drizzle.provider";
import { ClubT, SemesterD } from "src/drizzle/schema/club.schema";

import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import { Professor } from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export default class ClubTRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async findClubTById(clubId: number) {
    const crt = getKSTDate();
    return this.db
      .select()
      .from(ClubT)
      .where(
        and(
          eq(ClubT.clubId, clubId),
          or(
            and(isNull(ClubT.endTerm), lte(ClubT.endTerm, crt)),
            gte(ClubT.endTerm, crt),
          ),
        ),
      )
      .then(takeOne);
  }

  async findClubDetail(semesterId: number, clubId: number) {
    return this.db
      .select({
        clubStatusEnumId: ClubT.clubStatusEnumId,
        characteristicKr: ClubT.characteristicKr,
        professorId: ClubT.professorId,
        professorName: Professor.name,
      })
      .from(ClubT)
      .where(and(eq(ClubT.semesterId, semesterId), eq(ClubT.clubId, clubId)))
      .leftJoin(Professor, eq(Professor.id, ClubT.professorId))
      .then(result => ({
        clubStatusEnumId: result[0]?.clubStatusEnumId,
        characteristicKr: result[0]?.characteristicKr,
        advisor: result[0]?.professorId ? result[0].professorName : null,
      }));
  }

  async findClubById(clubId: number): Promise<boolean> {
    const crt = getKSTDate();
    const result = !!(await this.db
      .select({
        id: ClubT.clubId,
      })
      .from(ClubT)
      .where(
        and(
          eq(ClubT.clubId, clubId),
          or(
            and(isNull(ClubT.endTerm), lte(ClubT.endTerm, crt)),
            gte(ClubT.endTerm, crt),
          ),
        ),
      )
      .limit(1)
      .then(takeOne));
    return result;
  }

  async findSemesterByClubId(clubId: number) {
    return this.db
      .select({
        id: SemesterD.id,
        name: SemesterD.name,
        year: SemesterD.year,
      })
      .from(SemesterD)
      .innerJoin(ClubT, eq(SemesterD.id, ClubT.semesterId))
      .where(and(eq(ClubT.clubId, clubId), isNull(ClubT.deletedAt)))
      .orderBy(desc(SemesterD.id))
      .then(result =>
        result.map(row => ({
          id: row.id,
          year: row.year,
          name: row.name,
        })),
      );
  }

  async findProfessorSemester(professorId: number) {
    return this.db
      .select({
        id: SemesterD.id,
        name: SemesterD.name,
        year: SemesterD.year,
        startTerm: SemesterD.startTerm,
        endTerm: SemesterD.endTerm,
        clubs: { id: ClubT.clubId },
      })
      .from(ClubT)
      .leftJoin(SemesterD, eq(SemesterD.id, ClubT.semesterId))
      .where(eq(ClubT.professorId, professorId))
      .orderBy(desc(SemesterD.id))
      .then(result =>
        result.map(row => ({
          id: row.id,
          name: `${row.year} ${row.name}`,
          startTerm: row.startTerm,
          endTerm: row.endTerm,
          clubs: [{ id: row.clubs.id }],
        })),
      );
  }

  async selectBySemesterId(semesterId: number) {
    return this.db
      .select()
      .from(ClubT)
      .where(and(eq(ClubT.semesterId, semesterId), isNull(ClubT.deletedAt)))
      .then(result => result);
  }

  async findByClubIdAndSemesterId(clubId: number, semesterId: number) {
    return this.db
      .select()
      .from(ClubT)
      .where(
        and(
          eq(ClubT.clubId, clubId),
          eq(ClubT.semesterId, semesterId),
          isNull(ClubT.deletedAt),
        ),
      )
      .then(takeOne);
  }
}
