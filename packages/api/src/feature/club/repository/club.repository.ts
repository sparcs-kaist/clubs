import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  and,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { union } from "drizzle-orm/mysql-core";
import { MySql2Database } from "drizzle-orm/mysql2";
import { DrizzleAsyncProvider } from "src/drizzle/drizzle.provider";

import type { ApiClb001ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb001";
import { ISemester } from "@sparcs-clubs/interface/api/club/type/semester.type";
import { IDivision } from "@sparcs-clubs/interface/api/division/type/division.type";
import {
  ClubDelegateEnum,
  ClubTypeEnum,
} from "@sparcs-clubs/interface/common/enum/club.enum";

import { getKSTDate, takeOne } from "@sparcs-clubs/api/common/util/util";
import {
  Club,
  ClubDelegateD,
  ClubRoomT,
  ClubStudentT,
  ClubT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";
import {
  Division,
  DivisionPermanentClubD,
} from "@sparcs-clubs/api/drizzle/schema/division.schema";
import {
  Professor,
  ProfessorT,
  Student,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

import { MClub } from "../model/club.model";
import { VClubSummary } from "../model/club.summary.model";

interface IClubs {
  id: number;
  name: string;
  clubs: {
    type: number;
    id: number;
    nameKr: string;
    nameEn: string;
    isPermanent: boolean;
    characteristic: string;
    representative: string;
    advisor: string;
    totalMemberCnt: number;
  }[];
}

@Injectable()
export default class ClubRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  // clubId가 일치하는 club을 리스트로 가져옵니다.
  async findByClubId(clubId: number) {
    const clubList = await this.db
      .select()
      .from(Club)
      .where(eq(Club.id, clubId))
      .limit(1);

    return clubList;
  }

  async findClubDetail(clubId: number) {
    const crt = getKSTDate();
    const clubInfo = await this.db
      .select({
        id: Club.id,
        nameKr: Club.nameKr,
        nameEn: Club.nameEn,
        type: ClubT.clubStatusEnumId,
        characteristic: ClubT.characteristicKr,
        advisor: Professor.name,
        description: Club.description,
        foundingYear: Club.foundingYear,
      })
      .from(Club)
      .leftJoin(ClubT, eq(ClubT.clubId, Club.id))
      .leftJoin(Professor, eq(Professor.id, ClubT.professorId))
      .where(
        and(
          eq(Club.id, clubId),
          or(
            and(isNull(ClubT.endTerm), gte(ClubT.startTerm, crt)),
            gte(ClubT.endTerm, crt),
          ),
          or(eq(ClubT.clubStatusEnumId, 1), eq(ClubT.clubStatusEnumId, 2)),
        ),
      )
      .limit(1)
      .then(takeOne);

    const divisionName = await this.db
      .select({ name: Division.name })
      .from(Club)
      .leftJoin(Division, eq(Division.id, Club.divisionId))
      .where(eq(Club.id, clubId))
      .then(takeOne);
    return { ...clubInfo, divisionName };
  }

  async getClubs(): Promise<ApiClb001ResponseOK> {
    const crt = getKSTDate();
    const rows = await this.db
      .select({
        id: Division.id,
        name: Division.name,
        clubs: {
          type: ClubT.clubStatusEnumId,
          id: Club.id,
          nameKr: Club.nameKr,
          nameEn: Club.nameEn,
          isPermanent: DivisionPermanentClubD.id,
          characteristic: ClubT.characteristicKr,
          representative: Student.name,
          advisor: Professor.name,
          totalMemberCnt: sql<number>`count(${ClubStudentT.id})`,
        },
      })
      .from(Division)
      .leftJoin(Club, eq(Club.divisionId, Division.id))
      .innerJoin(
        ClubT,
        and(
          eq(Club.id, ClubT.clubId),
          or(
            and(isNull(ClubT.endTerm), lte(ClubT.startTerm, crt)),
            gte(ClubT.endTerm, crt),
          ),
          or(eq(ClubT.clubStatusEnumId, 1), eq(ClubT.clubStatusEnumId, 2)),
          isNull(ClubT.deletedAt),
        ),
      )
      .leftJoin(Professor, eq(ClubT.professorId, Professor.id))
      .leftJoin(
        ClubStudentT,
        and(
          eq(Club.id, ClubStudentT.clubId),
          lte(ClubStudentT.startTerm, crt),
          or(isNull(ClubStudentT.endTerm), gte(ClubStudentT.endTerm, crt)),
          isNull(ClubStudentT.deletedAt),
        ),
      )
      .leftJoin(
        ClubDelegateD,
        and(
          eq(Club.id, ClubDelegateD.clubId),
          eq(ClubDelegateD.ClubDelegateEnumId, 1),
          or(isNull(ClubDelegateD.endTerm), gte(ClubDelegateD.endTerm, crt)),
        ),
      )
      .leftJoin(Student, eq(ClubDelegateD.studentId, Student.id))
      .leftJoin(
        DivisionPermanentClubD,
        and(
          eq(DivisionPermanentClubD.clubId, Club.id),
          lte(DivisionPermanentClubD.startTerm, crt),
          or(
            gte(DivisionPermanentClubD.endTerm, crt),
            isNull(DivisionPermanentClubD.endTerm),
          ),
        ),
      )
      .groupBy(
        Division.id,
        Division.name,
        Club.id,
        Club.nameKr,
        Club.nameEn,
        ClubT.clubStatusEnumId,
        ClubT.characteristicKr,
        Student.name,
        Professor.name,
        DivisionPermanentClubD.id,
      );
    const record = rows.reduce<Record<number, IClubs>>((acc, row) => {
      const divId = row.id;
      const divName = row.name;
      const club = row.clubs;

      if (!acc[divId]) {
        acc[divId] = { id: divId, name: divName, clubs: [] };
      }

      if (club) {
        acc[divId].clubs.push({
          ...club,
          isPermanent: club.isPermanent !== null,
        });
      }
      return acc;
    }, {});
    const result = {
      divisions: Object.values(record),
    };
    return result;
  }

  async findClubActivities(studentId: number): Promise<{
    clubs: {
      id: number;
      nameKr: string;
      nameEn: string;
      dateRange: { startMonth: Date; endMonth: Date | undefined }[];
    }[];
  }> {
    const clubActivities = await this.db
      .select()
      .from(ClubStudentT)
      .leftJoin(Club, eq(Club.id, ClubStudentT.clubId))
      .where(eq(ClubStudentT.studentId, studentId))
      .then(rows =>
        rows.map(row => ({
          id: row.club_student_t.clubId,
          nameKr: row.club.nameKr,
          nameEn: row.club.nameEn,
          startMonth: row.club_student_t.startTerm,
          endMonth: row.club_student_t.endTerm,
        })),
      );

    const groupedActivities = clubActivities.reduce(
      (acc, activity) => {
        const { id, nameKr, nameEn, startMonth, endMonth } = activity;

        const updatedAcc = { ...acc };
        if (!updatedAcc[id]) {
          updatedAcc[id] = {
            id,
            nameKr,
            nameEn,
            dateRange: [{ startMonth, endMonth }],
          };
          return updatedAcc;
        }

        let updated = false;
        const { dateRange } = acc[id];

        for (let i = 0; i < dateRange.length; i += 1) {
          const dates = dateRange[i];

          if (
            startMonth.getTime() - dates.endMonth.getTime() ===
            24 * 60 * 60 * 1000
          ) {
            dates.endMonth = endMonth;
            updated = true;
            break;
          }
        }

        if (!updated) {
          acc[id].dateRange.push({ startMonth, endMonth });
        }

        return acc;
      },
      {} as {
        [key: number]: {
          id: number;
          nameKr: string;
          nameEn: string;
          dateRange: { startMonth: Date; endMonth: Date | undefined }[];
        };
      },
    );
    return { clubs: Object.values(groupedActivities) };
  }

  async findClubName(
    clubId: number,
  ): Promise<{ nameKr: string; nameEn: string }> {
    return this.db
      .select({ nameKr: Club.nameKr, nameEn: Club.nameEn })
      .from(Club)
      .where(eq(Club.id, clubId))
      .then(result =>
        result[0]
          ? { nameKr: result[0].nameKr, nameEn: result[0].nameEn }
          : undefined,
      );
  }

  async findClubIdByClubStatusEnumId(
    studentId: number,
    clubStatusEnumIds: Array<ClubTypeEnum>,
    semesterId: number,
  ) {
    const result = await this.db.transaction(async tx => {
      const cur = getKSTDate();
      const delegate = tx
        .select({
          clubId: ClubDelegateD.clubId,
        })
        .from(ClubDelegateD)
        .where(
          and(
            eq(ClubDelegateD.studentId, studentId),
            lte(ClubDelegateD.startTerm, cur),
            or(gte(ClubDelegateD.endTerm, cur), isNull(ClubDelegateD.endTerm)),
            isNull(ClubDelegateD.deletedAt),
          ),
        );
      const professor = tx
        .select({
          id: Professor.id,
          name: Professor.name,
          email: Professor.email,
          professorEnumId: ProfessorT.professorEnum,
        })
        .from(Professor)
        .innerJoin(
          ProfessorT,
          and(
            eq(Professor.id, ProfessorT.professorId),
            lte(ProfessorT.startTerm, cur),
            or(gt(ProfessorT.endTerm, cur), isNull(ProfessorT.endTerm)),
            isNull(ProfessorT.deletedAt),
          ),
        )
        .where(isNull(Professor.deletedAt))
        .as("professor");
      const club = await tx
        .selectDistinct({
          id: Club.id,
          clubNameKr: Club.nameKr,
          clubNameEn: Club.nameEn,
          professor: {
            name: professor.name,
            email: professor.email,
            professorEnumId: professor.professorEnumId,
          },
        })
        .from(Club)
        .innerJoin(
          ClubT,
          and(
            eq(Club.id, ClubT.clubId),
            eq(ClubT.semesterId, semesterId),
            isNull(ClubT.deletedAt),
            inArray(ClubT.clubStatusEnumId, clubStatusEnumIds),
          ),
        )
        .leftJoin(professor, eq(professor.id, ClubT.professorId))
        .where(and(inArray(Club.id, delegate), isNull(Club.deletedAt)));
      return club;
    });
    return result;
  }

  async findEligibleClubsForRegistration(
    studentId: number,
    semesterId: number,
  ) {
    // 주어진 semesterId를 기준으로 최근 2학기와 3학기를 계산
    const recentTwoSemesters = [semesterId - 1, semesterId];
    const { length } = recentTwoSemesters;
    const recentThreeSemesters = [semesterId - 2, semesterId - 1, semesterId];

    const result = await this.db.transaction(async tx => {
      const cur = getKSTDate();
      const delegate = tx
        .select({
          clubId: ClubDelegateD.clubId,
        })
        .from(ClubDelegateD)
        .where(
          and(
            eq(ClubDelegateD.studentId, studentId),
            lte(ClubDelegateD.startTerm, cur),
            or(gte(ClubDelegateD.endTerm, cur), isNull(ClubDelegateD.endTerm)),
            isNull(ClubDelegateD.deletedAt),
          ),
        );
      // 최근 2학기 동안 가동아리 상태를 유지한 클럽을 조회
      const provisionalClubs = tx
        .select({
          id: Club.id,
        })
        .from(Club)
        .innerJoin(ClubT, eq(Club.id, ClubT.clubId))
        .where(
          and(
            eq(ClubT.clubStatusEnumId, ClubTypeEnum.Provisional), // 가동아리
            inArray(ClubT.semesterId, recentTwoSemesters), // recentTwoSemesters에 포함된 학기 동안
            inArray(Club.id, delegate),
            isNull(ClubT.deletedAt),
          ),
        )
        .groupBy(Club.id)
        .having(sql`COUNT(DISTINCT ${ClubT.semesterId}) = ${length}`);
      // 최근 3학기 중 하나라도 정동아리 상태인 클럽을 조회
      const regularClubs = tx
        .select({
          id: Club.id,
        })
        .from(Club)
        .innerJoin(ClubT, eq(Club.id, ClubT.clubId))
        .where(
          and(
            eq(ClubT.clubStatusEnumId, ClubTypeEnum.Regular), // 정동아리
            inArray(ClubT.semesterId, recentThreeSemesters), // recentThreeSemesters에 포함된 학기 동안
            inArray(Club.id, delegate),
            isNull(ClubT.deletedAt),
          ),
        )
        .groupBy(Club.id);

      const professor = tx
        .select({
          id: Professor.id,
          name: Professor.name,
          email: Professor.email,
          professorEnumId: ProfessorT.professorEnum,
        })
        .from(Professor)
        .innerJoin(
          ProfessorT,
          and(
            eq(Professor.id, ProfessorT.professorId),
            lte(ProfessorT.startTerm, cur),
            or(gt(ProfessorT.endTerm, cur), isNull(ProfessorT.endTerm)),
            isNull(ProfessorT.deletedAt),
          ),
        )
        .where(isNull(Professor.deletedAt))
        .as("professor");

      const sq = union(provisionalClubs, regularClubs);
      const response = await tx
        .selectDistinct({
          id: Club.id,
          clubNameKr: Club.nameKr,
          clubNameEn: Club.nameEn,
          professor: {
            name: professor.name,
            email: professor.email,
            professorEnumId: professor.professorEnumId,
          },
        })
        .from(Club)
        .innerJoin(
          ClubT,
          and(
            eq(Club.id, ClubT.clubId),
            inArray(ClubT.clubId, sq),
            lte(ClubT.startTerm, cur),
            isNull(ClubT.deletedAt),
            or(isNull(ClubT.endTerm), gt(ClubT.endTerm, cur)),
          ),
        )
        .leftJoin(professor, eq(professor.id, ClubT.professorId))
        .where(isNull(Club.deletedAt));
      return response;
    });
    return result;
  }

  async fetchSummary(clubId: number): Promise<VClubSummary> {
    const result = await this.db
      .select()
      .from(Club)
      .leftJoin(ClubT, eq(Club.id, ClubT.clubId))
      .where(eq(Club.id, clubId))
      .orderBy(desc(ClubT.startTerm))
      .limit(1);

    if (result.length !== 1) {
      throw new NotFoundException("Club not found");
    }

    return VClubSummary.fromDBResult(result[0]);
  }

  async fetchSummaries(
    clubIds: number[],
    semesterIds?: number[],
  ): Promise<VClubSummary[]> {
    if (clubIds.length === 0) {
      return [];
    }

    const whereClause = [];

    if (clubIds.length > 0) {
      whereClause.push(inArray(Club.id, clubIds));
    }

    if (semesterIds && semesterIds.length > 0) {
      whereClause.push(inArray(ClubT.semesterId, semesterIds));
    } else {
      const cur = getKSTDate();
      whereClause.push(
        and(
          lte(ClubT.startTerm, cur),
          or(gte(ClubT.endTerm, cur), isNull(ClubT.endTerm)),
        ),
      );
    }

    whereClause.push(isNull(ClubT.deletedAt));

    const result = await this.db
      .select()
      .from(Club)
      .leftJoin(ClubT, eq(Club.id, ClubT.clubId))
      .where(and(...whereClause));

    return result.map(club => VClubSummary.fromDBResult(club));
  }

  async findOne(
    clubId: number,
    semester: ISemester,
    date?: Date,
  ): Promise<MClub | null> {
    const day = date ?? getKSTDate(semester.endTerm);

    // club 조건
    const whereClause = [];

    whereClause.push(eq(Club.id, clubId));

    whereClause.push(eq(ClubT.semesterId, semester.id));

    whereClause.push(isNull(ClubT.deletedAt));

    // delegate 조건
    const delegateWhereClause = [];

    delegateWhereClause.push(eq(ClubDelegateD.clubId, clubId));

    delegateWhereClause.push(
      and(
        lte(ClubDelegateD.startTerm, day),
        or(gte(ClubDelegateD.endTerm, day), isNull(ClubDelegateD.endTerm)),
      ),
    );

    delegateWhereClause.push(isNull(ClubDelegateD.deletedAt));

    const [clubResult, delegateResult] = await Promise.all([
      this.db
        .select()
        .from(Club)
        .innerJoin(ClubT, eq(Club.id, ClubT.clubId))
        .leftJoin(
          ClubRoomT,
          and(
            eq(Club.id, ClubRoomT.clubId),
            eq(ClubT.semesterId, ClubRoomT.semesterId),
          ),
        )
        .where(and(...whereClause)),
      this.db
        .select()
        .from(ClubDelegateD)
        .where(and(...delegateWhereClause)),
    ]);

    if (clubResult.length !== 1) {
      return null;
    }

    const club = clubResult[0];

    if (
      !delegateResult.some(
        e => e.ClubDelegateEnumId === ClubDelegateEnum.Representative,
      )
    ) {
      return null;
    }

    return MClub.fromDBResult({
      ...club,
      club_delegate_d: delegateResult,
    });
  }

  async find(param: {
    id?: IClubs["id"];
    ids?: IClubs["id"][];
    semester: ISemester;
    clubStatusEnumId?: ClubTypeEnum;
    clubStatusEnumIds?: ClubTypeEnum[];
    divisionId?: IDivision["id"];
    date?: Date;
  }): Promise<MClub[]> {
    if (!param.semester) {
      throw new BadRequestException("Semester or date is required");
    }
    const day = param.date ?? getKSTDate(param.semester.endTerm);
    const whereClause = [];
    const delegateWhereClause = [];
    if (param.id) {
      whereClause.push(eq(Club.id, param.id));
      delegateWhereClause.push(eq(ClubDelegateD.clubId, param.id));
    }

    if (param.ids) {
      whereClause.push(inArray(Club.id, param.ids));
      delegateWhereClause.push(inArray(ClubDelegateD.clubId, param.ids));
    }

    if (param.semester) {
      whereClause.push(eq(ClubT.semesterId, param.semester.id));
    }

    if (param.clubStatusEnumId) {
      whereClause.push(eq(ClubT.clubStatusEnumId, param.clubStatusEnumId));
    }

    if (param.clubStatusEnumIds) {
      whereClause.push(
        inArray(ClubT.clubStatusEnumId, param.clubStatusEnumIds),
      );
    }
    if (param.divisionId) {
      whereClause.push(eq(Club.divisionId, param.divisionId));
    }

    whereClause.push(isNull(Club.deletedAt));
    whereClause.push(isNull(ClubT.deletedAt));

    delegateWhereClause.push(
      and(
        lte(ClubDelegateD.startTerm, day),
        or(gte(ClubDelegateD.endTerm, day), isNull(ClubDelegateD.endTerm)),
      ),
    );

    const [clubResult, delegateResult] = await Promise.all([
      this.db
        .select()
        .from(Club)
        .innerJoin(ClubT, eq(Club.id, ClubT.clubId))
        .leftJoin(
          ClubRoomT,
          and(
            eq(Club.id, ClubRoomT.clubId),
            eq(ClubT.semesterId, ClubRoomT.semesterId),
          ),
        )
        .where(and(...whereClause)),
      this.db
        .select()
        .from(ClubDelegateD)
        .where(and(...delegateWhereClause)),
    ]);

    return clubResult.map(club =>
      MClub.fromDBResult({
        ...club,
        club_delegate_d: delegateResult.filter(e => e.clubId === club.club.id),
      }),
    );
  }

  async fetch(
    clubId: number,
    semester: ISemester,
    date?: Date,
  ): Promise<MClub> {
    const result = await this.findOne(clubId, semester, date);
    if (!result) {
      throw new NotFoundException("Club not found");
    }
    return result;
  }
}
