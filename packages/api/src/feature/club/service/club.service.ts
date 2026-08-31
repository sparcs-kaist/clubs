import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";

import type {
  ApiClb001RequestQuery,
  ApiClb001ResponseOK,
} from "@clubs/interface/api/club/endpoint/apiClb001";
import type {
  ApiClb002RequestParam,
  ApiClb002RequestQuery,
  ApiClb002ResponseOK,
} from "@clubs/interface/api/club/endpoint/apiClb002";
import type { ApiClb003ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb003";
import type {
  ApiClb004RequestParam,
  ApiClb004ResponseOK,
} from "@clubs/interface/api/club/endpoint/apiClb004";
import type {
  ApiClb005RequestBody,
  ApiClb005RequestParam,
  ApiClb005ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb005";
import {
  ApiClb009RequestParam,
  ApiClb009ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb009";
import {
  ApiClb010RequestParam,
  ApiClb010ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb010";
import type { ApiClb016ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb016";
import type { ApiClb017ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb017";
import type { ApiClb018ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb018";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { env } from "@sparcs-clubs/api/env";
import { ClubRoomTRepository } from "@sparcs-clubs/api/feature/club/repository-old/club.club-room-t.repository";
import { RegistrationPublicService } from "@sparcs-clubs/api/feature/registration/service/registration.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";

import { ClubDelegateDRepository } from "../delegate/club.club-delegate-d.repository";
import { ClubDelegateChangeRequestRepository } from "../repository/club-delegate-change-request.repository";
import { ClubDelegateRepository } from "../repository/club-delegate-repository";
import { ClubSemesterRepository } from "../repository/club-semester.repository";
import ClubStudentTRepository from "../repository-old/club.club-student-t.repository";
import ClubTRepository from "../repository-old/club.club-t.repository";
import { DivisionPermanentClubDRepository } from "../repository-old/club.division-permanent-club-d.repository";
import { ClubGetStudentClubBrief } from "../repository-old/club.get-student-club-brief";
import { ClubPutStudentClubBrief } from "../repository-old/club.put-student-club-brief";
import { ClubOldRepository } from "../repository-old/club-old.repository";
import ClubPublicService from "./club.public.service";

@Injectable()
export class ClubService {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(
    private clubOldRepository: ClubOldRepository,
    private clubDelegateDRepository: ClubDelegateDRepository,
    private clubRoomTRepository: ClubRoomTRepository,
    private clubStudentTRepository: ClubStudentTRepository,
    private clubTRepository: ClubTRepository,
    private divisionPermanentClubDRepository: DivisionPermanentClubDRepository,
    private clubGetStudentClubBrief: ClubGetStudentClubBrief,
    private clubPutStudentClubBrief: ClubPutStudentClubBrief,
    private clubPublicService: ClubPublicService,
    private registrationPublicService: RegistrationPublicService,
    private readonly semesterPublicService: SemesterPublicService,
    private readonly clubSemesterRepository: ClubSemesterRepository,
    private readonly clubDelegateRepository: ClubDelegateRepository,
    private readonly clubDelegateChangeRequestRepository: ClubDelegateChangeRequestRepository,
  ) {}

  private readonly EXCLUDED_CLUB_IDS: number[] =
    env.NODE_ENV === "local" ? [] : [112, 113, 121];

  async getClubs(query: ApiClb001RequestQuery): Promise<ApiClb001ResponseOK> {
    if (query.semesterId !== undefined) {
      const semester = await this.semesterPublicService.getById(
        query.semesterId,
      );
      const snapshotDate = this.getSemesterSnapshotDate(semester.endTerm);
      const clubs = await this.clubPublicService.searchClubDetailByDate({
        date: snapshotDate,
        semesterId: semester.id,
        clubTypeEnum: [ClubTypeEnum.Regular, ClubTypeEnum.Provisional],
      });
      const visibleClubs = clubs.filter(
        club => !this.EXCLUDED_CLUB_IDS.includes(club.id),
      );

      // ponytail: 과거 목록은 저빈도 경로라 기존 조회를 재사용한다. 느려지면 학기별 단일 집계로 교체한다.
      const clubRows = await Promise.all(
        visibleClubs.map(async club => {
          const [totalMemberCnt, isPermanent] = await Promise.all([
            this.clubStudentTRepository.findTotalMemberCnt(
              club.id,
              semester.id,
            ),
            this.divisionPermanentClubDRepository.findPermenantClub(
              club.id,
              snapshotDate,
            ),
          ]);

          return {
            club,
            summary: {
              id: club.id,
              nameKr: club.nameKr,
              nameEn: club.nameEn,
              type: club.clubTypeEnum,
              isPermanent,
              characteristic: club.characteristicKr,
              representative: club.clubRepresentative.name,
              advisor: club.professor?.name,
              totalMemberCnt,
            },
          };
        }),
      );
      const divisions = new Map<
        number,
        ApiClb001ResponseOK["divisions"][number] & { districtId: number }
      >();

      clubRows.forEach(({ club, summary }) => {
        const division = divisions.get(club.division.id);
        if (division) {
          division.clubs.push(summary);
          return;
        }
        divisions.set(club.division.id, {
          id: club.division.id,
          name: club.division.name,
          districtId: club.division.district.id,
          clubs: [summary],
        });
      });

      return {
        divisions: [...divisions.values()]
          .sort((a, b) => {
            if (a.districtId !== b.districtId) {
              return a.districtId - b.districtId;
            }
            return a.name.localeCompare(b.name);
          })
          .map(({ districtId: _districtId, ...division }) => division),
      };
    }

    const result = await this.clubOldRepository.getAllClubsGroupedByDivision();

    result.divisions = result.divisions.map(division => ({
      ...division,
      clubs: division.clubs.filter(
        club => !this.EXCLUDED_CLUB_IDS.includes(club.id),
      ),
    }));

    return result;
  }

  async getClubSemesterCounts(): Promise<ApiClb018ResponseOk> {
    const counts = await this.clubSemesterRepository.countClubsBySemester(
      this.EXCLUDED_CLUB_IDS,
    );
    return { counts };
  }

  async getClub(
    param: ApiClb002RequestParam,
    query: ApiClb002RequestQuery,
  ): Promise<ApiClb002ResponseOK> {
    const { clubId } = param;
    if (query.semesterId !== undefined) {
      const semester = await this.semesterPublicService.getById(
        query.semesterId,
      );
      const snapshotDate = this.getSemesterSnapshotDate(semester.endTerm);
      const clubs = await this.clubPublicService.searchClubDetailByDate({
        date: snapshotDate,
        semesterId: semester.id,
        clubId,
        clubTypeEnum: [ClubTypeEnum.Regular, ClubTypeEnum.Provisional],
      });
      const club = clubs[0];
      if (!club) {
        throw new NotFoundException(`ClubOld with ID ${clubId} not found.`);
      }
      if (this.EXCLUDED_CLUB_IDS.includes(club.id)) {
        throw new NotFoundException(`ClubOld with ID ${clubId} not found.`);
      }
      const [totalMemberCnt, isPermanent] = await Promise.all([
        this.clubStudentTRepository.findTotalMemberCnt(club.id, semester.id),
        this.divisionPermanentClubDRepository.findPermenantClub(
          club.id,
          snapshotDate,
        ),
      ]);

      return {
        id: club.id,
        nameKr: club.nameKr,
        nameEn: club.nameEn,
        type: club.clubTypeEnum,
        characteristic: club.characteristicKr,
        advisor: club.professor?.name,
        division: { id: club.division.id, name: club.division.name },
        description: club.description ?? "",
        isPermanent,
        foundingYear: club.foundingYear,
        totalMemberCnt,
        representative: club.clubRepresentative.name,
        room: "",
      };
    }

    const currentSemester = await this.semesterPublicService.load();
    let targetSemesterId = currentSemester.id;
    try {
      await this.registrationPublicService.checkDeadline({
        enums: [RegistrationDeadlineEnum.ClubRegistrationApplication],
      });
      targetSemesterId -= 1;
    } catch {
      // do nothing
    }
    const [
      clubDetails,
      totalMemberCnt,
      representative,
      roomDetails,
      isPermanent,
    ] = await Promise.all([
      this.clubOldRepository.findClubDetail(clubId),
      this.clubStudentTRepository.findTotalMemberCnt(clubId, targetSemesterId),
      this.clubDelegateDRepository.findRepresentativeName(clubId),
      this.clubRoomTRepository.findClubLocationById(clubId),
      this.divisionPermanentClubDRepository.findPermenantClub(clubId),
    ]);

    if (!clubDetails) {
      throw new NotFoundException(`ClubOld with ID ${clubId} not found.`);
    }
    return {
      id: clubDetails.id,
      nameKr: clubDetails.nameKr,
      nameEn: clubDetails.nameEn,
      type: clubDetails.type,
      characteristic: clubDetails.characteristic,
      advisor: clubDetails.advisor,
      division: clubDetails.division,
      description: clubDetails.description ? clubDetails.description : "",
      isPermanent,
      foundingYear: clubDetails.foundingYear,
      totalMemberCnt: totalMemberCnt ?? 0,
      representative: representative?.name ?? "",
      room: roomDetails
        ? `${roomDetails.buildingName} ${roomDetails.room}`
        : "",
    };
  }

  private getSemesterSnapshotDate(endTerm: Date): Date {
    const now = this.clock.now();
    return now < endTerm ? now : new Date(endTerm.getTime() - 1);
  }

  async getStudentClubsMy(studentId: number): Promise<ApiClb003ResponseOK> {
    const studentSemesters =
      await this.clubStudentTRepository.findStudentSemester(studentId);

    const result = await Promise.all(
      studentSemesters.map(async semester => {
        const clubs = await Promise.all(
          semester.clubs.map(async (club: { id: number }) => {
            const now = this.clock.now();
            const isCurrentSemester = now <= semester.endTerm;
            const clubName = await this.clubOldRepository.findClubName(club.id);
            const clubInfo = await this.clubTRepository.findClubDetail(
              semester.id,
              club.id,
            );
            const totalMemberCnt =
              await this.clubStudentTRepository.findTotalMemberCnt(
                club.id,
                semester.id,
              );
            const representative =
              await this.clubDelegateDRepository.findRepresentativeName(
                club.id,
                isCurrentSemester ? null : semester.startTerm,
              );
            const isPermanent =
              await this.divisionPermanentClubDRepository.findPermenantClub(
                club.id,
                semester.startTerm,
              );

            return {
              type: clubInfo.clubStatusEnumId,
              id: club.id,
              nameKr: clubName.nameKr,
              nameEn: clubName.nameEn,
              isPermanent,
              characteristic: clubInfo.characteristicKr,
              representative: representative
                ? representative.name
                : "기록 없음",
              advisor: clubInfo.advisor,
              totalMemberCnt,
            };
          }),
        );

        return {
          id: semester.id,
          name: semester.name,
          clubs,
        };
      }),
    );

    const uniqueSemesters = result.reduce((acc, curr) => {
      const existingSemester = acc.find(s => s.id === curr.id);
      if (existingSemester) {
        existingSemester.clubs.push(...curr.clubs);
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    return { semesters: uniqueSemesters };
  }

  async getStudentClubBrief(
    studentId: number,
    param: ApiClb004RequestParam,
  ): Promise<ApiClb004ResponseOK> {
    const { clubId } = param;
    const isAvailableClub = await this.clubSemesterRepository.count({
      clubId,
      date: this.clock.now(),
    });
    if (!isAvailableClub) {
      throw new HttpException("ClubOld not available", HttpStatus.FORBIDDEN);
    }
    const isAvailableRepresentative =
      await this.clubDelegateDRepository.findRepresentativeByClubIdAndStudentId(
        studentId,
        clubId,
      );
    if (!isAvailableRepresentative) {
      throw new HttpException(
        "Representative not available",
        HttpStatus.FORBIDDEN,
      );
    }
    const result =
      await this.clubGetStudentClubBrief.getStudentClubBrief(clubId);
    // result가 null인지 확인해서 null인 경우 에러?
    return result;
  }

  async putStudentClubBrief(
    studentId: number,
    param: ApiClb005RequestParam,
    body: ApiClb005RequestBody,
  ): Promise<ApiClb005ResponseOk> {
    const { clubId } = param;
    const isAvailableClub = await this.clubSemesterRepository.count({
      clubId,
      date: this.clock.now(),
    });
    if (!isAvailableClub) {
      throw new HttpException("ClubOld not available", HttpStatus.FORBIDDEN);
    }
    const isAvailableRepresentative =
      await this.clubDelegateDRepository.findRepresentativeByClubIdAndStudentId(
        studentId,
        clubId,
      );
    if (!isAvailableRepresentative) {
      throw new HttpException(
        "Representative not available",
        HttpStatus.FORBIDDEN,
      );
    }
    const result = await this.clubPutStudentClubBrief.putStudentClubBrief(
      clubId,
      body.description,
      body.roomPassword,
    );
    if (!result)
      throw new HttpException(
        "Failed to update club brief",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    // result가 null인지 확인해서 null인 경우 에러?
    return {};
  }

  async getStudentClubSemesters(
    studentId: number,
    param: ApiClb009RequestParam,
  ): Promise<ApiClb009ResponseOk> {
    const { clubId } = param;
    const isAvailableDelegate = await this.clubPublicService.isStudentDelegate(
      studentId,
      clubId,
    );
    if (!isAvailableDelegate) {
      throw new HttpException("Delegate not available", HttpStatus.FORBIDDEN);
    }
    const result = await this.clubTRepository.findSemesterByClubId(clubId);
    return { semesters: result };
  }

  async getStudentClubMembers(
    studentId: number,
    param: ApiClb010RequestParam,
  ): Promise<ApiClb010ResponseOk> {
    const { clubId, semesterId } = param;
    const isAvailableDelegate = await this.clubPublicService.isStudentDelegate(
      studentId,
      clubId,
    );
    if (!isAvailableDelegate) {
      throw new HttpException("Delegate not available", HttpStatus.FORBIDDEN);
    }
    const result =
      await this.clubStudentTRepository.selectMemberByClubIdAndSemesterId(
        clubId,
        semesterId,
      );
    return { members: result };
  }

  async getProfessorClubsMy(professorId: number): Promise<ApiClb016ResponseOk> {
    const professorSemesters =
      await this.clubTRepository.findProfessorSemester(professorId);

    const result = await Promise.all(
      professorSemesters.map(async semester => {
        const clubs = await Promise.all(
          semester.clubs.map(async (club: { id: number }) => {
            const now = this.clock.now();
            const isCurrentSemester = now <= semester.endTerm;
            const clubName = await this.clubOldRepository.findClubName(club.id);
            const clubInfo = await this.clubTRepository.findClubDetail(
              semester.id,
              club.id,
            );
            const totalMemberCnt =
              await this.clubStudentTRepository.findTotalMemberCnt(
                club.id,
                semester.id,
              );
            const representative =
              await this.clubDelegateDRepository.findRepresentativeName(
                club.id,
                isCurrentSemester ? null : semester.startTerm,
              );
            const isPermanent =
              await this.divisionPermanentClubDRepository.findPermenantClub(
                club.id,
                semester.startTerm,
              );

            return {
              type: clubInfo.clubStatusEnumId,
              id: club.id,
              nameKr: clubName.nameKr,
              nameEn: clubName.nameEn,
              isPermanent,
              characteristic: clubInfo.characteristicKr,
              representative: representative
                ? representative.name
                : "기록 없음",
              advisor: clubInfo.advisor,
              totalMemberCnt,
            };
          }),
        );

        return {
          id: semester.id,
          name: semester.name,
          clubs,
        };
      }),
    );

    const uniqueSemesters = result.reduce((acc, curr) => {
      const existingSemester = acc.find(s => s.id === curr.id);
      if (existingSemester) {
        existingSemester.clubs.push(...curr.clubs);
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    return { semesters: uniqueSemesters };
  }

  @Transactional()
  async cancelRegistration(clubId: number): Promise<ApiClb017ResponseOk> {
    const now = this.clock.now();
    const semesterId = await this.clubSemesterRepository.cancelRegistration(
      clubId,
      now,
    );
    await this.clubDelegateRepository.endCurrentTerms(clubId, now);
    await this.clubDelegateChangeRequestRepository.cancelAppliedRequests(
      clubId,
      now,
    );
    await this.registrationPublicService.rejectPendingMemberRegistrations(
      clubId,
      semesterId,
    );

    return {};
  }
}
