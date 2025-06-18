import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/domain/registration/member-registration";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  ClubBuildingEnum,
  ClubDelegate,
  ClubDelegateEnum,
  ClubOld,
  ClubRoomT,
  ClubStudentT,
  ClubT,
} from "@sparcs-clubs/api/drizzle/schema/club.schema";
import {
  District,
  Division,
} from "@sparcs-clubs/api/drizzle/schema/division.schema";
import { RegistrationApplicationStudent } from "@sparcs-clubs/api/drizzle/schema/registration.schema";
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
    return this.db
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
      .$dynamic();
  }

  findDelegates(year: number, semesterName: string) {
    return this.db
      .select({
        clubId: ClubOld.id,
        delegateType: ClubDelegateEnum.id,
        name: User.name,
        studentNumber: Student.number,
        phoneNumber: Student.phoneNumber,
        kaistEmail: Student.email,
        department: Department.name,
      })
      .from(ClubDelegate)
      .leftJoin(
        ClubDelegateEnum,
        eq(ClubDelegateEnum.id, ClubDelegate.clubDelegateEnum),
      )
      .leftJoin(ClubT, eq(ClubT.clubId, ClubDelegate.clubId))
      .leftJoin(SemesterD, eq(SemesterD.id, ClubT.semesterId))
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
      .leftJoin(Department, eq(Department.departmentId, StudentT.department))
      .where(
        and(
          isNull(ClubDelegate.endTerm),
          isNull(ClubDelegate.deletedAt),
          isNull(ClubT.deletedAt),
          isNull(ClubOld.deletedAt),
          eq(SemesterD.year, year),
          eq(SemesterD.name, semesterName),
        ),
      );
  }

  findClubs(year: number, semesterName: string) {
    return this.db
      .select({
        clubId: ClubOld.id,
        division: Division.name,
        district: District.name,
        clubNameKr: ClubOld.nameKr,
        clubNameEn: ClubOld.nameEn,
        clubStatus: ClubT.clubStatusEnumId,
        description: ClubOld.description,
        characteristicKr: ClubT.characteristicKr,
        characteristicEn: ClubT.characteristicEn,
        advisor: User.name,
        foundingYear: ClubOld.foundingYear,
        clubBuildingEnum: ClubBuildingEnum.id,
        roomLocation: ClubRoomT.roomLocation,
        roomPassword: ClubRoomT.roomPassword,
        totalMemberCnt: sql<number>`count(distinct ${ClubStudentT.id})`,
        regularMemberCnt: sql<number>`count(distinct ${RegistrationApplicationStudent.studentId})`,
      })
      .from(ClubT)
      .leftJoin(SemesterD, eq(SemesterD.id, ClubT.semesterId))
      .leftJoin(ClubOld, eq(ClubOld.id, ClubT.clubId))
      .leftJoin(Division, eq(Division.id, ClubOld.divisionId))
      .leftJoin(District, eq(District.id, Division.districtId))
      .leftJoin(Professor, eq(Professor.id, ClubT.professorId))
      .leftJoin(User, eq(User.id, Professor.userId))
      .leftJoin(
        ClubStudentT,
        and(
          eq(ClubOld.id, ClubStudentT.clubId),
          eq(ClubT.semesterId, ClubStudentT.semesterId),
        ),
      )
      .leftJoin(
        RegistrationApplicationStudent,
        and(
          eq(RegistrationApplicationStudent.clubId, ClubT.clubId),
          eq(RegistrationApplicationStudent.studentId, ClubStudentT.studentId),
          eq(
            RegistrationApplicationStudent.registrationApplicationStudentEnum,
            RegistrationApplicationStudentStatusEnum.Approved,
          ),
        ),
      )
      .leftJoin(
        ClubRoomT,
        and(
          eq(ClubRoomT.clubId, ClubT.clubId),
          eq(ClubRoomT.semesterId, ClubT.semesterId),
        ),
      )
      .leftJoin(
        ClubBuildingEnum,
        eq(ClubBuildingEnum.id, ClubRoomT.clubBuildingEnum),
      )
      .where(
        and(
          isNull(ClubT.deletedAt),
          isNull(ClubOld.deletedAt),
          isNull(Professor.deletedAt),
          eq(SemesterD.year, year),
          eq(SemesterD.name, semesterName),
        ),
      )
      .groupBy(
        ClubT.id,
        ClubRoomT.clubBuildingEnum,
        ClubRoomT.roomLocation,
        ClubRoomT.roomPassword,
      );
  }
}
