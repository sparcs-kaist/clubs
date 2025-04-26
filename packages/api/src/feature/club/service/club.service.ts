import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type {
  ApiAct009RequestQuery,
  ApiAct009ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct009";
import type { ApiClb001ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb001";
import type {
  ApiClb002RequestParam,
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
import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";

import { env } from "@sparcs-clubs/api/env";
import { ClubRoomTRepository } from "@sparcs-clubs/api/feature/club/repository/club.club-room-t.repository";
import { RegistrationPublicService } from "@sparcs-clubs/api/feature/registration/service/registration.public.service";
import { ActivityDurationPublicService } from "@sparcs-clubs/api/feature/semester/publicService/activity.duration.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";

import { ClubDelegateDRepository } from "../delegate/club.club-delegate-d.repository";
import ClubStudentTRepository from "../repository/club.club-student-t.repository";
import ClubTRepository from "../repository/club.club-t.repository";
import { DivisionPermanentClubDRepository } from "../repository/club.division-permanent-club-d.repository";
import { ClubGetStudentClubBrief } from "../repository/club.get-student-club-brief";
import { ClubPutStudentClubBrief } from "../repository/club.put-student-club-brief";
import { ClubOldRepository } from "../repository/club-old.repository";
import ClubPublicService from "./club.public.service";

@Injectable()
export class ClubService {
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
    private readonly activityDurationPublicService: ActivityDurationPublicService,
  ) {}

  private readonly EXCLUDED_CLUB_IDS: number[] =
    env.NODE_ENV === "local" ? [] : [112, 113, 121];

  async getClubs(): Promise<ApiClb001ResponseOK> {
    const result = await this.clubOldRepository.getAllClubsGroupedByDivision();

    result.divisions = result.divisions.map(division => ({
      ...division,
      clubs: division.clubs.filter(
        club => !this.EXCLUDED_CLUB_IDS.includes(club.id),
      ),
    }));

    return result;
  }

  async getClub(param: ApiClb002RequestParam): Promise<ApiClb002ResponseOK> {
    const { clubId } = param;
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
      throw new NotFoundException(`Club with ID ${clubId} not found.`);
    }
    if (!totalMemberCnt || !representative) {
      throw new NotFoundException(
        `Some details for club ID ${clubId} are missing.`,
      );
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
      totalMemberCnt,
      representative: representative.name,
      room: roomDetails
        ? `${roomDetails.buildingName} ${roomDetails.room}`
        : "",
    };
  }

  async getStudentClubsMy(studentId: number): Promise<ApiClb003ResponseOK> {
    const studentSemesters =
      await this.clubStudentTRepository.findStudentSemester(studentId);

    const result = await Promise.all(
      studentSemesters.map(async semester => {
        const clubs = await Promise.all(
          semester.clubs.map(async (club: { id: number }) => {
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
                semester.startTerm,
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
    const isAvailableClub = await this.clubTRepository.findClubById(clubId);
    if (!isAvailableClub) {
      throw new HttpException("Club not available", HttpStatus.FORBIDDEN);
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
    const isAvailableClub = await this.clubTRepository.findClubById(clubId);
    if (!isAvailableClub) {
      throw new HttpException("Club not available", HttpStatus.FORBIDDEN);
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
                semester.startTerm,
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

  async getStudentActivitiesActivityTerms(
    query: ApiAct009RequestQuery,
    studentId: number,
  ): Promise<ApiAct009ResponseOk> {
    // 요청한 학생이 동아리의 대표자인지 확인합니다.
    await this.clubPublicService.checkStudentDelegate(studentId, query.clubId);
    // 해당 동아리가 등록되었던 학기 정보를 가져오고, startTerm과 endTerm에 대응되는 활동기간을 조회합니다.
    const semesters = await this.clubPublicService.getClubsExistedSemesters({
      clubId: query.clubId,
    });

    const activityTerms: ApiAct009ResponseOk["terms"] = [];
    await Promise.all(
      semesters.map(async semester => {
        const startActivityTerm = await this.activityDurationPublicService.load(
          {
            date: semester.startTerm,
          },
        );
        const endActivityTerm = await this.activityDurationPublicService.load({
          date: semester.endTerm,
        });
        if (
          activityTerms.find(e => e.id === startActivityTerm.id) ===
            undefined &&
          startActivityTerm.endTerm < new Date()
        )
          activityTerms.push({
            id: startActivityTerm.id,
            year: startActivityTerm.year,
            name: startActivityTerm.name,
            startTerm: startActivityTerm.startTerm,
            endTerm: startActivityTerm.endTerm,
          });
        if (
          activityTerms.find(e => e.id === endActivityTerm.id) === undefined &&
          endActivityTerm.endTerm < new Date()
        )
          activityTerms.push({
            id: endActivityTerm.id,
            year: endActivityTerm.year,
            name: endActivityTerm.name,
            startTerm: endActivityTerm.startTerm,
            endTerm: endActivityTerm.endTerm,
          });
      }),
    );

    return {
      terms: activityTerms.sort(
        (a, b) => a.startTerm.getTime() - b.startTerm.getTime(),
      ),
    };
  }
}
