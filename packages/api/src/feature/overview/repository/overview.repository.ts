import { Inject, Injectable } from "@nestjs/common";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/domain/registration/member-registration";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { ClubRepository } from "@sparcs-clubs/api/feature/club/repository/club.repository";
import { ClubDelegateRepository } from "@sparcs-clubs/api/feature/club/repository/club-delegate-repository";
import { ClubMemberRepository } from "@sparcs-clubs/api/feature/club/repository/club-member.repository";
import { ClubOverviewRoomRepository } from "@sparcs-clubs/api/feature/club/repository/overview-room/club-overview-room.repository";
import ClubTRepository from "@sparcs-clubs/api/feature/club/repository-old/club.club-t.repository";
import { MemberRegistrationRepository } from "@sparcs-clubs/api/feature/registration/repository/member-registration.repository";
import { UserOverviewRepository } from "@sparcs-clubs/api/feature/user/repository/sso-login/user-overview.repository";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class OverviewRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly clubRepository: ClubRepository,
    private readonly clubTerms: ClubTRepository,
    private readonly clubDelegates: ClubDelegateRepository,
    private readonly roomRepository: ClubOverviewRoomRepository,
    private readonly userRepository: UserOverviewRepository,
    private readonly clubMembers: ClubMemberRepository,
    private readonly memberRegistrations: MemberRegistrationRepository,
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

  private async findActiveClubTerms(semesterId: number) {
    const terms = await this.clubTerms.selectBySemesterId(semesterId);
    if (terms.length === 0) return [];
    const clubs = await this.clubRepository.find({
      id: [...new Set(terms.map(term => term.clubId))],
    });
    const clubById = new Map(clubs.map(club => [club.id, club]));
    return terms.flatMap(term => {
      const club = clubById.get(term.clubId);
      return club ? [{ ...term, club }] : [];
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
    const clubTerms = await this.findActiveClubTerms(semester.id);
    if (clubTerms.length === 0) return [];
    const delegates = await this.clubDelegates.find({
      clubId: [...new Set(clubTerms.map(term => term.clubId))],
      date: criteriaDate,
    });
    const students = await this.userRepository.findStudents(
      [...new Set(delegates.map(delegate => delegate.student.id))],
      semester.id,
    );
    const studentById = new Map(students.map(student => [student.id, student]));
    const departmentIds = Array.from(
      new Set(
        students
          .map(student => student.studentTs[0]?.department)
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
      const student = studentById.get(delegate.student.id);
      if (!student) throw new Error("Overview delegate student missing");
      const departmentId = student.studentTs[0]?.department;
      return {
        clubId: delegate.club.id,
        delegateType: delegate.clubDelegateEnum,
        name: student.user?.name ?? student.name,
        studentNumber: student.number,
        phoneNumber: student.user?.phoneNumber ?? null,
        kaistEmail: student.email,
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

    const clubs = await this.findActiveClubTerms(semester.id);
    if (clubs.length === 0) return [];
    const clubIds = clubs.map(club => club.club.id);
    const [fundamentals, rooms, professors] = await Promise.all([
      this.findClubsFundamentals(year, semesterName),
      this.roomRepository.findBySemester(clubIds, semester.id),
      this.userRepository.findProfessors(
        clubs.map(club => club.professorId).filter(id => id !== null),
      ),
    ]);
    const fundamentalById = new Map(
      fundamentals.map(club => [club.clubId, club]),
    );
    const roomByClubId = new Map(
      rooms
        .slice()
        .reverse()
        .map(room => [room.clubId, room]),
    );
    const professorById = new Map(
      professors.map(professor => [professor.id, professor]),
    );
    const [clubStudentRows, approvedRegistrationRows] = await Promise.all([
      this.clubMembers.find({
        clubId: clubIds,
        semesterId: semester.id,
      }),
      this.memberRegistrations.find({
        clubId: clubIds,
        registrationApplicationStudentEnum: approvedStatus,
      }),
    ]);

    const memberStudentIdsByClubId = clubStudentRows.reduce(
      (map, clubStudent) => {
        const studentIds = map.get(clubStudent.club.id) ?? new Set<number>();
        studentIds.add(clubStudent.student.id);
        map.set(clubStudent.club.id, studentIds);

        return map;
      },
      new Map<number, Set<number>>(),
    );

    const regularMemberStudentIdsByClubId = approvedRegistrationRows.reduce(
      (map, registration) => {
        const memberStudentIds = memberStudentIdsByClubId.get(
          registration.club.id,
        );

        if (memberStudentIds?.has(registration.student.id)) {
          const regularMemberStudentIds =
            map.get(registration.club.id) ?? new Set<number>();
          regularMemberStudentIds.add(registration.student.id);
          map.set(registration.club.id, regularMemberStudentIds);
        }

        return map;
      },
      new Map<number, Set<number>>(),
    );

    return clubs.map(club => {
      const room = roomByClubId.get(club.clubId);
      const professor = professorById.get(club.professorId);
      let advisor: string | null = null;
      if (professor) {
        if (!professor.deletedAt) {
          advisor = professor.user?.name ?? professor.name;
        }
      }

      const fundamental = fundamentalById.get(club.clubId);

      return {
        clubId: club.club.id,
        division: fundamental?.division ?? "",
        district: fundamental?.district ?? "",
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
