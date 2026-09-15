import { Inject, Injectable } from "@nestjs/common";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/domain/registration/member-registration";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class OverviewRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  private getDelegateCriteriaDate(
    semesterStartTerm: Date,
    semesterEndTerm: Date,
  ) {
    const now = this.clock.now();

    if (now < semesterStartTerm) {
      return semesterStartTerm;
    }

    if (semesterEndTerm < now) {
      return semesterEndTerm;
    }

    return now;
  }

  private async getDivisionNameById(divisionIds: number[]) {
    const divisions = await this.prisma.division.findMany({
      where: { id: { in: [...new Set(divisionIds)] }, deletedAt: null },
      select: {
        id: true,
        name: true,
        district: { select: { name: true } },
      },
    });

    return new Map(
      divisions.map(division => [
        division.id,
        {
          division: division.name,
          district: division.district.name,
        },
      ]),
    );
  }

  async findClubsFundamentals(year: number, semesterName: string) {
    const semester = await this.prisma.semesterD.findFirst({
      where: { year, name: semesterName, deletedAt: null },
      select: { endTerm: true, id: true },
    });

    if (!semester) {
      return [];
    }

    const clubs = await this.prisma.clubT.findMany({
      where: {
        semesterId: semester.id,
        deletedAt: null,
        club: { deletedAt: null },
      },
      select: {
        clubStatusEnumId: true,
        club: {
          select: {
            id: true,
            nameKr: true,
            nameEn: true,
            divisionId: true,
            clubDivisionHistories: {
              where: {
                deletedAt: null,
                startTerm: { lte: semester.endTerm },
                OR: [{ endTerm: null }, { endTerm: { gte: semester.endTerm } }],
              },
              orderBy: [{ startTerm: "desc" }, { id: "desc" }],
              take: 1,
              select: {
                division: {
                  select: {
                    name: true,
                    district: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const divisionById = await this.getDivisionNameById(
      clubs.map(club => club.club.divisionId),
    );

    return clubs.map(club => {
      const historyDivision = club.club.clubDivisionHistories[0]?.division;
      const fallbackDivision = divisionById.get(club.club.divisionId);

      return {
        clubId: club.club.id,
        division: historyDivision?.name ?? fallbackDivision?.division ?? "",
        district:
          historyDivision?.district.name ?? fallbackDivision?.district ?? "",
        clubNameKr: club.club.nameKr ?? "",
        clubNameEn: club.club.nameEn ?? "",
        clubStatus: club.clubStatusEnumId,
      };
    });
  }

  async findDelegates(year: number, semesterName: string) {
    const semester = await this.prisma.semesterD.findFirst({
      where: { year, name: semesterName, deletedAt: null },
      select: { endTerm: true, id: true, startTerm: true },
    });

    if (!semester) {
      return [];
    }

    const criteriaDate = this.getDelegateCriteriaDate(
      semester.startTerm,
      semester.endTerm,
    );

    const delegates = await this.prisma.clubDelegateD.findMany({
      where: {
        OR: [{ endTerm: null }, { endTerm: { gt: criteriaDate } }],
        startTerm: { lte: criteriaDate },
        deletedAt: null,
        club: {
          deletedAt: null,
          clubTs: {
            some: { semesterId: semester.id, deletedAt: null },
          },
        },
      },
      select: {
        clubId: true,
        clubDelegateEnum: true,
        student: {
          select: {
            number: true,
            name: true,
            email: true,
            user: {
              select: {
                name: true,
                phoneNumber: true,
              },
            },
            studentTs: {
              where: { semesterId: semester.id, deletedAt: null },
              select: { department: true },
              take: 1,
            },
          },
        },
      },
    });

    const departmentIds = Array.from(
      new Set(
        delegates
          .map(delegate => delegate.student.studentTs[0]?.department)
          .filter(
            (department): department is number =>
              typeof department === "number",
          ),
      ),
    );
    const departments = await this.prisma.department.findMany({
      where: { departmentId: { in: departmentIds }, deletedAt: null },
      select: { departmentId: true, name: true },
    });
    const departmentNameById = new Map(
      departments
        .filter(department => typeof department.departmentId === "number")
        .map(department => [department.departmentId, department.name]),
    );

    return delegates.map(delegate => {
      const departmentId = delegate.student.studentTs[0]?.department;

      return {
        clubId: delegate.clubId,
        delegateType: delegate.clubDelegateEnum,
        name: delegate.student.user?.name ?? delegate.student.name,
        studentNumber: delegate.student.number,
        phoneNumber: delegate.student.user?.phoneNumber ?? null,
        kaistEmail: delegate.student.email,
        department: departmentNameById.get(departmentId) ?? "",
      };
    });
  }

  async findClubs(year: number, semesterName: string) {
    const approvedStatus = RegistrationApplicationStudentStatusEnum.Approved;
    const semester = await this.prisma.semesterD.findFirst({
      where: { year, name: semesterName, deletedAt: null },
      select: { endTerm: true, id: true },
    });

    if (!semester) {
      return [];
    }

    const clubs = await this.prisma.clubT.findMany({
      where: {
        semesterId: semester.id,
        deletedAt: null,
        club: { deletedAt: null },
      },
      select: {
        clubStatusEnumId: true,
        characteristicKr: true,
        characteristicEn: true,
        professor: {
          select: {
            deletedAt: true,
            name: true,
            user: { select: { name: true } },
          },
        },
        club: {
          select: {
            id: true,
            nameKr: true,
            nameEn: true,
            description: true,
            foundingYear: true,
            divisionId: true,
            clubRoomTs: {
              where: { semesterId: semester.id, deletedAt: null },
              take: 1,
              select: {
                clubBuildingEnum: true,
                roomLocation: true,
                roomPassword: true,
              },
            },
            clubDivisionHistories: {
              where: {
                deletedAt: null,
                startTerm: { lte: semester.endTerm },
                OR: [{ endTerm: null }, { endTerm: { gte: semester.endTerm } }],
              },
              orderBy: [{ startTerm: "desc" }, { id: "desc" }],
              take: 1,
              select: {
                division: {
                  select: {
                    name: true,
                    district: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const clubIds = clubs.map(club => club.club.id);
    const [divisionById, clubStudentRows, approvedRegistrationRows] =
      await Promise.all([
        this.getDivisionNameById(clubs.map(club => club.club.divisionId)),
        this.prisma.clubStudentT.findMany({
          where: {
            clubId: { in: clubIds },
            semesterId: semester.id,
            deletedAt: null,
          },
          select: { clubId: true, studentId: true },
        }),
        this.prisma.registrationApplicationStudent.findMany({
          where: {
            clubId: { in: clubIds },
            deletedAt: null,
            registrationApplicationStudentEnum: approvedStatus,
          },
          select: { clubId: true, studentId: true },
        }),
      ]);

    const memberStudentIdsByClubId = clubStudentRows.reduce(
      (map, clubStudent) => {
        const studentIds = map.get(clubStudent.clubId) ?? new Set<number>();
        studentIds.add(clubStudent.studentId);
        map.set(clubStudent.clubId, studentIds);

        return map;
      },
      new Map<number, Set<number>>(),
    );

    const regularMemberStudentIdsByClubId = approvedRegistrationRows.reduce(
      (map, registration) => {
        const memberStudentIds = memberStudentIdsByClubId.get(
          registration.clubId,
        );

        if (memberStudentIds?.has(registration.studentId)) {
          const regularMemberStudentIds =
            map.get(registration.clubId) ?? new Set<number>();
          regularMemberStudentIds.add(registration.studentId);
          map.set(registration.clubId, regularMemberStudentIds);
        }

        return map;
      },
      new Map<number, Set<number>>(),
    );

    return clubs.map(club => {
      const room = club.club.clubRoomTs[0];
      let advisor: string | null = null;
      if (club.professor) {
        if (!club.professor.deletedAt) {
          advisor = club.professor.user?.name ?? club.professor.name;
        }
      }

      const historyDivision = club.club.clubDivisionHistories[0]?.division;
      const fallbackDivision = divisionById.get(club.club.divisionId);

      return {
        clubId: club.club.id,
        division: historyDivision?.name ?? fallbackDivision?.division ?? "",
        district:
          historyDivision?.district.name ?? fallbackDivision?.district ?? "",
        clubNameKr: club.club.nameKr ?? "",
        clubNameEn: club.club.nameEn ?? "",
        clubStatus: club.clubStatusEnumId,
        description: club.club.description,
        characteristicKr: club.characteristicKr,
        characteristicEn: club.characteristicEn,
        advisor,
        foundingYear: club.club.foundingYear,
        clubBuildingEnum: room?.clubBuildingEnum ?? null,
        roomLocation: room?.roomLocation ?? null,
        roomPassword: room?.roomPassword ?? null,
        totalMemberCnt: BigInt(
          memberStudentIdsByClubId.get(club.club.id)?.size ?? 0,
        ),
        regularMemberCnt: BigInt(
          regularMemberStudentIdsByClubId.get(club.club.id)?.size ?? 0,
        ),
      };
    });
  }
}
