import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  // ClubOld,
  ClubDelegate,
  ClubDelegateEnum,
  ClubOld,
  ClubStudentT,
  ClubT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";
import {
  District,
  Division,
} from "@sparcs-clubs/api/drizzle/schema/division.schema";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";
import {
  Department,
  Professor,
  Student,
  StudentT,
  User,
} from "@sparcs-clubs/api/drizzle/schema/user.schema";

@Injectable()
export class OverviewRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  findClubsFundamentals(year: number, semesterName: string) {
    return (
      this.db
        .select({
          clubId: ClubOld.id,
          division: Division.name,
          district: District.name,
          clubNameKr: ClubOld.nameKr,
          clubNameEn: ClubOld.nameEn,
          clubStatus: ClubT.clubStatusEnumId,
        })
        .from(ClubT)
        .leftJoin(SemesterD, eq(SemesterD.id, ClubT.semesterId))
        // .leftJoin(ClubOld, eq(ClubOld.id, ClubT.clubId))
        .leftJoin(ClubOld, eq(ClubOld.id, ClubT.clubId))
        .leftJoin(Division, eq(Division.id, ClubOld.divisionId))
        .leftJoin(District, eq(District.id, Division.districtId))
        .where(
          and(
            isNull(ClubT.deletedAt),
            isNull(ClubOld.deletedAt),
            eq(SemesterD.year, year),
            eq(SemesterD.name, semesterName),
          ),
        )
        .$dynamic()
    );
  }

  findDelegates(year: number, semesterName: string) {
    return (
      this.db
        .select({
          clubId: ClubOld.id,
          delegateType: ClubDelegateEnum.id,
          name: User.name,
          studentNumber: Student.number,
          phoneNumber: Student.phoneNumber,
          kaistEmail: Student.email,
        })
        .from(ClubDelegate)
        .leftJoin(
          ClubDelegateEnum,
          eq(ClubDelegateEnum.id, ClubDelegate.clubDelegateEnum),
        )
        .leftJoin(ClubT, eq(ClubT.id, ClubDelegate.clubId))
        .leftJoin(SemesterD, eq(SemesterD.id, ClubT.semesterId))
        // .leftJoin(ClubOld, eq(ClubOld.id, ClubT.clubId))
        .leftJoin(ClubOld, eq(ClubOld.id, ClubT.clubId))
        .leftJoin(Division, eq(Division.id, ClubOld.divisionId))
        .leftJoin(District, eq(District.id, Division.districtId))
        .leftJoin(Student, eq(Student.id, ClubDelegate.studentId))
        .leftJoin(
          StudentT,
          and(
            eq(StudentT.id, ClubDelegate.studentId),
            eq(StudentT.semesterId, SemesterD.id),
          ),
        )
        .leftJoin(User, eq(User.id, Student.userId))
        .leftJoin(Department, eq(Department.id, StudentT.department))
        .where(
          and(
            isNull(ClubDelegate.endTerm),
            isNull(ClubDelegate.deletedAt),
            isNull(ClubT.deletedAt),
            isNull(ClubOld.deletedAt),
            eq(SemesterD.year, year),
            eq(SemesterD.name, semesterName),
          ),
        )
    );
  }

  findClubs(year: number, semesterName: string) {
    return this.db
      .select({
        division: Division.name,
        district: District.name,
        clubNameKr: ClubOld.nameKr,
        clubNameEn: ClubOld.nameEn,
        description: ClubOld.description,
        advisor: Professor.name,
        foundingYear: ClubOld.foundingYear,
        totalMemberCnt: sql<number>`count(${ClubStudentT.id})`,
      })
      .from(ClubT)
      .leftJoin(SemesterD, eq(SemesterD.id, ClubT.semesterId))
      .leftJoin(ClubOld, eq(ClubOld.id, ClubT.clubId))
      .leftJoin(ClubOld, eq(ClubOld.id, ClubT.clubId))
      .leftJoin(Division, eq(Division.id, ClubOld.divisionId))
      .leftJoin(District, eq(District.id, Division.districtId))
      .where(
        and(
          isNull(ClubT.deletedAt),
          isNull(ClubOld.deletedAt),
          eq(SemesterD.year, year),
          eq(SemesterD.name, semesterName),
        ),
      )
      .leftJoin(Professor, eq(Professor.id, ClubT.professorId))
      .leftJoin(
        ClubStudentT,
        and(
          eq(ClubOld.id, ClubStudentT.clubId),
          isNull(ClubStudentT.endTerm),
          isNull(ClubStudentT.deletedAt),
        ),
      );
  }
}
