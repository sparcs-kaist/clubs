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

import { ISemester } from "@clubs/domain/semester/semester";

import type { ApiClb001ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb001";
import { IDivision } from "@clubs/interface/api/division/type/division.type";
import {
  ClubDelegateEnum,
  ClubTypeEnum,
} from "@clubs/interface/common/enum/club.enum";

import {
  getKSTDate,
  getKSTDateForQuery,
  takeOne,
} from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  ClubDelegate,
  ClubOld,
  ClubRoomT,
  ClubStudentT,
  ClubT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";
import {
  Division,
  DivisionPermanentClubD,
} from "@sparcs-clubs/api/drizzle/schema/division.schema";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import {
  Professor,
  ProfessorT,
  Student,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

import { VClubSummary } from "../model/club.summary.model";
import { MClubOld } from "../model/club-old.model";

interface IClubs {
  id: number;
  name: string;
  districtId: number;
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
export class ClubOldRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  // clubId가 일치하는 club을 리스트로 가져옵니다.
  async findByClubId(clubId: number) {
    const clubList = await this.db
      .select()
      .from(ClubOld)
      .where(eq(ClubOld.id, clubId))
      .limit(1);

    return clubList;
  }

  async findClubDetail(clubId: number) {
    const crt = getKSTDate();
    const clubInfo = await this.db
      .select({
        id: ClubOld.id,
        nameKr: ClubOld.nameKr,
        nameEn: ClubOld.nameEn,
        type: ClubT.clubStatusEnumId,
        characteristic: ClubT.characteristicKr,
        advisor: Professor.name,
        description: ClubOld.description,
        foundingYear: ClubOld.foundingYear,
      })
      .from(ClubOld)
      .leftJoin(ClubT, eq(ClubT.clubId, ClubOld.id))
      .leftJoin(Professor, eq(Professor.id, ClubT.professorId))
      .where(
        and(
          eq(ClubOld.id, clubId),
          or(
            and(isNull(ClubT.endTerm), gte(ClubT.startTerm, crt)),
            gte(ClubT.endTerm, crt),
          ),
          or(eq(ClubT.clubStatusEnumId, 1), eq(ClubT.clubStatusEnumId, 2)),
        ),
      )
      .limit(1)
      .then(takeOne);

    const division = await this.db
      .select({ id: Division.id, name: Division.name })
      .from(ClubOld)
      .leftJoin(Division, eq(Division.id, ClubOld.divisionId))
      .where(eq(ClubOld.id, clubId))
      .then(takeOne);
    return { ...clubInfo, division };
  }

  async getAllClubsGroupedByDivision(): Promise<ApiClb001ResponseOK> {
    const crt = getKSTDateForQuery();
    const clubs = await this.db
      .select({
        id: Division.id,
        districtId: Division.districtId,
        name: Division.name,
        club: {
          type: ClubT.clubStatusEnumId,
          id: ClubOld.id,
          nameKr: ClubOld.nameKr,
          nameEn: ClubOld.nameEn,
          isPermanent: DivisionPermanentClubD.id,
          characteristic: ClubT.characteristicKr,
          representative: Student.name,
          advisor: Professor.name,
          totalMemberCnt: sql<number>`count(${ClubStudentT.id})`,
        },
      })
      .from(Division)
      .leftJoin(ClubOld, eq(ClubOld.divisionId, Division.id))
      .innerJoin(
        ClubT,
        and(
          eq(ClubOld.id, ClubT.clubId),
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
          eq(ClubOld.id, ClubStudentT.clubId),
          lte(ClubStudentT.startTerm, crt),
          or(isNull(ClubStudentT.endTerm), gte(ClubStudentT.endTerm, crt)),
          isNull(ClubStudentT.deletedAt),
        ),
      )
      .leftJoin(
        ClubDelegate,
        and(
          eq(ClubOld.id, ClubDelegate.clubId),
          eq(ClubDelegate.clubDelegateEnum, 1),
          or(isNull(ClubDelegate.endTerm), gte(ClubDelegate.endTerm, crt)),
        ),
      )
      .leftJoin(Student, eq(ClubDelegate.studentId, Student.id))
      .leftJoin(
        DivisionPermanentClubD,
        and(
          eq(DivisionPermanentClubD.clubId, ClubOld.id),
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
        ClubOld.id,
        ClubOld.nameKr,
        ClubOld.nameEn,
        ClubT.clubStatusEnumId,
        ClubT.characteristicKr,
        Student.name,
        Professor.name,
        DivisionPermanentClubD.id,
      );

    const stackedClubs = clubs.reduce<Record<number, IClubs>>(
      (
        acc,
        { id: divId, name: divName, club: divClub, districtId: divDistrictId },
      ) => {
        acc[divId] ??= {
          id: divId,
          name: divName,
          clubs: [],
          districtId: divDistrictId,
        };

        if (divClub) {
          acc[divId].clubs.push({
            ...divClub,
            isPermanent: divClub.isPermanent !== null,
          });
        }
        return acc;
      },
      {},
    );

    const sortedClubs = Object.values(stackedClubs)
      .sort((a, b) => {
        if (a.districtId !== b.districtId) {
          return a.districtId - b.districtId;
        }
        return a.name.localeCompare(b.name);
      })
      .map(({ districtId: _districtId, ...rest }) => rest);

    const result = {
      divisions: sortedClubs,
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
      .leftJoin(ClubOld, eq(ClubOld.id, ClubStudentT.clubId))
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
      .select({ nameKr: ClubOld.nameKr, nameEn: ClubOld.nameEn })
      .from(ClubOld)
      .where(eq(ClubOld.id, clubId))
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
          clubId: ClubDelegate.clubId,
        })
        .from(ClubDelegate)
        .where(
          and(
            eq(ClubDelegate.studentId, studentId),
            lte(ClubDelegate.startTerm, cur),
            or(gte(ClubDelegate.endTerm, cur), isNull(ClubDelegate.endTerm)),
            isNull(ClubDelegate.deletedAt),
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
          id: ClubOld.id,
          clubNameKr: ClubOld.nameKr,
          clubNameEn: ClubOld.nameEn,
          professor: {
            name: professor.name,
            email: professor.email,
            professorEnumId: professor.professorEnumId,
          },
        })
        .from(ClubOld)
        .innerJoin(
          ClubT,
          and(
            eq(ClubOld.id, ClubT.clubId),
            eq(ClubT.semesterId, semesterId),
            isNull(ClubT.deletedAt),
            inArray(ClubT.clubStatusEnumId, clubStatusEnumIds),
          ),
        )
        .leftJoin(professor, eq(professor.id, ClubT.professorId))
        .where(and(inArray(ClubOld.id, delegate), isNull(ClubOld.deletedAt)));
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
          clubId: ClubDelegate.clubId,
        })
        .from(ClubDelegate)
        .where(
          and(
            eq(ClubDelegate.studentId, studentId),
            lte(ClubDelegate.startTerm, cur),
            or(gte(ClubDelegate.endTerm, cur), isNull(ClubDelegate.endTerm)),
            isNull(ClubDelegate.deletedAt),
          ),
        );
      // 최근 2학기 동안 가동아리 상태를 유지한 클럽을 조회
      const provisionalClubs = tx
        .select({
          id: ClubOld.id,
        })
        .from(ClubOld)
        .innerJoin(ClubT, eq(ClubOld.id, ClubT.clubId))
        .where(
          and(
            eq(ClubT.clubStatusEnumId, ClubTypeEnum.Provisional), // 가동아리
            inArray(ClubT.semesterId, recentTwoSemesters), // recentTwoSemesters에 포함된 학기 동안
            inArray(ClubOld.id, delegate),
            isNull(ClubT.deletedAt),
          ),
        )
        .groupBy(ClubOld.id)
        .having(sql`COUNT(DISTINCT ${ClubT.semesterId}) = ${length}`);
      // 최근 3학기 중 하나라도 정동아리 상태인 클럽을 조회
      const regularClubs = tx
        .select({
          id: ClubOld.id,
        })
        .from(ClubOld)
        .innerJoin(ClubT, eq(ClubOld.id, ClubT.clubId))
        .where(
          and(
            eq(ClubT.clubStatusEnumId, ClubTypeEnum.Regular), // 정동아리
            inArray(ClubT.semesterId, recentThreeSemesters), // recentThreeSemesters에 포함된 학기 동안
            inArray(ClubOld.id, delegate),
            isNull(ClubT.deletedAt),
          ),
        )
        .groupBy(ClubOld.id);

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
          id: ClubOld.id,
          clubNameKr: ClubOld.nameKr,
          clubNameEn: ClubOld.nameEn,
          professor: {
            name: professor.name,
            email: professor.email,
            professorEnumId: professor.professorEnumId,
          },
        })
        .from(ClubOld)
        .innerJoin(
          ClubT,
          and(
            eq(ClubOld.id, ClubT.clubId),
            inArray(ClubT.clubId, sq),
            lte(ClubT.startTerm, cur),
            isNull(ClubT.deletedAt),
            or(isNull(ClubT.endTerm), gt(ClubT.endTerm, cur)),
          ),
        )
        .leftJoin(professor, eq(professor.id, ClubT.professorId))
        .where(isNull(ClubOld.deletedAt));
      return response;
    });
    return result;
  }

  async fetchSummary(clubId: number): Promise<VClubSummary> {
    const result = await this.db
      .select()
      .from(ClubOld)
      .leftJoin(ClubT, eq(ClubOld.id, ClubT.clubId))
      .where(
        and(
          eq(ClubOld.id, clubId),
          isNull(ClubOld.deletedAt),
          isNull(ClubT.deletedAt),
        ),
      )
      .orderBy(desc(ClubT.startTerm))
      .limit(1);

    if (result.length !== 1) {
      throw new NotFoundException("ClubOld not found");
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
      whereClause.push(inArray(ClubOld.id, clubIds));
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
    whereClause.push(isNull(ClubOld.deletedAt));
    whereClause.push(isNull(ClubT.deletedAt));

    const result = await this.db
      .select()
      .from(ClubOld)
      .leftJoin(ClubT, eq(ClubOld.id, ClubT.clubId))
      .where(and(...whereClause));

    return result.map(club => VClubSummary.fromDBResult(club));
  }

  async findOne(
    clubId: number,
    semester: ISemester,
    date?: Date,
  ): Promise<MClubOld | null> {
    const day = date ?? getKSTDate(semester.endTerm);

    // club 조건
    const whereClause = [];

    whereClause.push(eq(ClubOld.id, clubId));

    whereClause.push(eq(ClubT.semesterId, semester.id));

    whereClause.push(isNull(ClubT.deletedAt));

    // delegate 조건
    const delegateWhereClause = [];

    delegateWhereClause.push(eq(ClubDelegate.clubId, clubId));

    delegateWhereClause.push(
      and(
        lte(ClubDelegate.startTerm, day),
        or(gte(ClubDelegate.endTerm, day), isNull(ClubDelegate.endTerm)),
      ),
    );

    delegateWhereClause.push(isNull(ClubDelegate.deletedAt));

    const [clubResult, delegateResult] = await Promise.all([
      this.db
        .select()
        .from(ClubOld)
        .innerJoin(ClubT, eq(ClubOld.id, ClubT.clubId))
        .leftJoin(
          ClubRoomT,
          and(
            eq(ClubOld.id, ClubRoomT.clubId),
            eq(ClubT.semesterId, ClubRoomT.semesterId),
          ),
        )
        .where(and(...whereClause)),
      this.db
        .select()
        .from(ClubDelegate)
        .where(and(...delegateWhereClause)),
    ]);

    if (clubResult.length !== 1) {
      return null;
    }

    const club = clubResult[0];

    if (
      !delegateResult.some(
        e => e.clubDelegateEnum === ClubDelegateEnum.Representative,
      )
    ) {
      return null;
    }

    return MClubOld.fromDBResult({
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
  }): Promise<MClubOld[]> {
    if (!param.semester) {
      throw new BadRequestException("Semester or date is required");
    }
    const day = param.date ?? getKSTDate(param.semester.endTerm);
    const whereClause = [];
    const delegateWhereClause = [];
    if (param.id) {
      whereClause.push(eq(ClubOld.id, param.id));
      delegateWhereClause.push(eq(ClubDelegate.clubId, param.id));
    }

    if (param.ids) {
      whereClause.push(inArray(ClubOld.id, param.ids));
      delegateWhereClause.push(inArray(ClubDelegate.clubId, param.ids));
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
      whereClause.push(eq(ClubOld.divisionId, param.divisionId));
    }

    whereClause.push(isNull(ClubOld.deletedAt));
    whereClause.push(isNull(ClubT.deletedAt));

    delegateWhereClause.push(
      and(
        lte(ClubDelegate.startTerm, day),
        or(gte(ClubDelegate.endTerm, day), isNull(ClubDelegate.endTerm)),
      ),
    );

    const [clubResult, delegateResult] = await Promise.all([
      this.db
        .select()
        .from(ClubOld)
        .innerJoin(ClubT, eq(ClubOld.id, ClubT.clubId))
        .leftJoin(
          ClubRoomT,
          and(
            eq(ClubOld.id, ClubRoomT.clubId),
            eq(ClubT.semesterId, ClubRoomT.semesterId),
          ),
        )
        .where(and(...whereClause)),
      this.db
        .select()
        .from(ClubDelegate)
        .where(and(...delegateWhereClause)),
    ]);

    return clubResult.map(club =>
      MClubOld.fromDBResult({
        ...club,
        club_delegate_d: delegateResult.filter(e => e.clubId === club.club.id),
      }),
    );
  }

  async fetch(
    clubId: number,
    semester: ISemester,
    date?: Date,
  ): Promise<MClubOld> {
    const result = await this.findOne(clubId, semester, date);
    if (!result) {
      throw new NotFoundException("ClubOld not found");
    }
    return result;
  }

  /**
   * @param clubId 동아리 id
   * @returns 해당 동아리가 등록했던 학기들의 정보를 리턴합니다.
   * 동아리가 등록했던 학기의 구분은 ClubT 테이블을 기준으로 합니다.
   * TODO: History 로 넘어가야 합니다.
   */
  async selectSemestersByClubId(param: { clubId: number }) {
    const result = await this.db
      .select()
      .from(SemesterD)
      .innerJoin(ClubT, eq(SemesterD.id, ClubT.semesterId))
      .where(and(eq(ClubT.clubId, param.clubId), isNull(ClubT.deletedAt)))
      .then(e => e.map(({ semester_d }) => semester_d)); // eslint-disable-line camelcase
    return result;
  }
}
