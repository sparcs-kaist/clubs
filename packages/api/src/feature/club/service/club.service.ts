import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import type { ApiClb001ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb001";
import type {
  ApiClb002RequestParam,
  ApiClb002ResponseOK,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb002";
import type { ApiClb003ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb003";
import type {
  ApiClb004RequestParam,
  ApiClb004ResponseOK,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb004";
import type {
  ApiClb005RequestBody,
  ApiClb005RequestParam,
  ApiClb005ResponseOk,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb005";
import {
  ApiClb009RequestParam,
  ApiClb009ResponseOk,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb009";
import {
  ApiClb010RequestParam,
  ApiClb010ResponseOk,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb010";
import type { ApiClb016ResponseOk } from "@sparcs-clubs/interface/api/club/endpoint/apiClb016";
import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import { ClubRoomTRepository } from "@sparcs-clubs/api/feature/club/repository/club.club-room-t.repository";
import { ClubRegistrationPublicService } from "@sparcs-clubs/api/feature/registration/club-registration/service/club-registration.public.service";

import { ClubDelegateDRepository } from "../delegate/club.club-delegate-d.repository";
import ClubStudentTRepository from "../repository/club.club-student-t.repository";
import ClubTRepository from "../repository/club.club-t.repository";
import { DivisionPermanentClubDRepository } from "../repository/club.division-permanent-club-d.repository";
import { ClubGetStudentClubBrief } from "../repository/club.get-student-club-brief";
import { ClubPutStudentClubBrief } from "../repository/club.put-student-club-brief";
import ClubRepository from "../repository/club.repository";
import ClubPublicService from "./club.public.service";

@Injectable()
export class ClubService {
  constructor(
    private clubRepository: ClubRepository,
    private clubDelegateDRepository: ClubDelegateDRepository,
    private clubRoomTRepository: ClubRoomTRepository,
    private clubStudentTRepository: ClubStudentTRepository,
    private clubTRepository: ClubTRepository,
    private divisionPermanentClubDRepository: DivisionPermanentClubDRepository,
    private clubGetStudentClubBrief: ClubGetStudentClubBrief,
    private clubPutStudentClubBrief: ClubPutStudentClubBrief,
    private clubPublicService: ClubPublicService,
    private clubRegistrationPublicService: ClubRegistrationPublicService,
  ) {}

  // private readonly EXCLUDED_CLUB_IDS: number[] = [112, 113, 121];
  private readonly EXCLUDED_CLUB_IDS: number[] = [113, 121];

  async getClubs(): Promise<ApiClb001ResponseOK> {
    const result = await this.clubRepository.getAllClubsGroupedByDivision();

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
    const today = getKSTDate();
    const currentSemester = await this.clubPublicService.fetchSemester(today);
    let targetSemesterId = currentSemester.id;
    try {
      await this.clubRegistrationPublicService.checkDeadline({
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
      this.clubRepository.findClubDetail(clubId),
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
      divisionName: clubDetails.divisionName.name,
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
            const clubName = await this.clubRepository.findClubName(club.id);
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
            const clubName = await this.clubRepository.findClubName(club.id);
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
}
