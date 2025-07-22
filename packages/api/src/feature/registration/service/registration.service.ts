import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import type {
  ApiReg001RequestBody,
  ApiReg001ResponseCreated,
} from "@clubs/interface/api/registration/endpoint/apiReg001";
import type { ApiReg002ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg002";
import type { ApiReg003ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg003";
import { ApiReg005ResponseCreated } from "@clubs/interface/api/registration/endpoint/apiReg005";
import {
  ApiReg006ResponseNoContent,
  ApiReg006ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg006";
import { ApiReg007ResponseNoContent } from "@clubs/interface/api/registration/endpoint/apiReg007";
import { ApiReg008ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg008";
import type {
  ApiReg009RequestBody,
  ApiReg009ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg009";
import type { ApiReg010ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg010";
import type { ApiReg011ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg011";
import type { ApiReg012ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg012";
import { ApiReg013ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg013";
import type { ApiReg014ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg014";
import type { ApiReg015ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg015";
import type { ApiReg016ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg016";
import type { ApiReg017ResponseCreated } from "@clubs/interface/api/registration/endpoint/apiReg017";
import type { ApiReg018ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg018";
import type {
  ApiReg019RequestQuery,
  ApiReg019ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg019";
import type {
  ApiReg020RequestQuery,
  ApiReg020ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg020";
import type { ApiReg021ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg021";
import type { ApiReg022ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg022";
import type {
  ApiReg023RequestParam,
  ApiReg023ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg023";
import type { ApiReg024ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg024";
import { ApiReg025ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg025";
import { ApiReg026ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg026";
import { ApiReg027ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg027";
import { ApiReg028ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg028";
import { IStudent } from "@clubs/interface/api/user/type/user.type";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import {
  RegistrationApplicationStudentStatusEnum,
  RegistrationDeadlineEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import logger from "@sparcs-clubs/api/common/util/logger";
import { takeOne, takeOnlyOne } from "@sparcs-clubs/api/common/util/util";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import DivisionPublicService from "@sparcs-clubs/api/feature/division/service/division.public.service";
import FilePublicService from "@sparcs-clubs/api/feature/file/service/file.public.service";
import { RegistrationDeadlinePublicService } from "@sparcs-clubs/api/feature/semester/publicService/registration.deadline.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { MMemberRegistration } from "../model/member.registration.model";
import { ClubRegistrationRepository } from "../repository/club-registration.repository";
import { MemberRegistrationRepository } from "../repository/member-registration.repository";
import { RegistrationPublicService } from "./registration.public.service";

interface ApiReg006ResponseType {
  status: number;
  data: ApiReg006ResponseOk | ApiReg006ResponseNoContent;
}

@Injectable()
export class RegistrationService {
  constructor(
    private readonly clubRegistrationRepository: ClubRegistrationRepository,
    private clubPublicService: ClubPublicService,
    private divisionPublicService: DivisionPublicService,
    private filePublicService: FilePublicService,
    private registrationPublicService: RegistrationPublicService,
    private userPublicService: UserPublicService,
    private readonly memberRegistrationRepository: MemberRegistrationRepository,
    private readonly semesterPublicService: SemesterPublicService,
    private readonly registrationDeadlinePublicService: RegistrationDeadlinePublicService,
  ) {}

  /**
   * @description 동아리 대표자인지 검증하는 로직은 repository쪽에서 진행됩니다.
   */
  async postStudentRegistrationClubRegistration(
    studentId: number,
    body: ApiReg001RequestBody,
  ): Promise<ApiReg001ResponseCreated> {
    // - 현재 동아리 등록 신청 기간이 맞는지 확인합니다.
    await this.registrationPublicService.checkDeadline({
      enums: [RegistrationDeadlineEnum.ClubRegistrationApplication],
    });
    logger.debug(
      "[postStudentRegistrationClubRegistration] deadline check passed",
    );
    // - 신규 가동아리 신청을 제외하곤 기존 동아리 대표자 또는 대의원의 신청인지 검사합니다.
    // 위 검사는 repository transaction 첫 파트에서 검사됩니다.
    // - 신규 가동아리 신청을 제외하곤 기존 동아리 id를 제출해야 합니다.
    // 위 검사는 REG-001 인터페이스에서 검사합니다
    // - 이미 해당 동아리 id로 신청이 진행중일 경우 신청이 불가합니다.

    const semesterId = await this.semesterPublicService.loadId();
    const clubRegistrationList =
      await this.clubRegistrationRepository.findByClubAndSemesterId(
        body.clubId,
        semesterId,
      );
    if (clubRegistrationList.length !== 0) {
      throw new HttpException(
        "your club request already exists",
        HttpStatus.BAD_REQUEST,
      );
    }
    const myRegistrationList =
      await this.clubRegistrationRepository.findByStudentAndSemesterId(
        studentId,
        semesterId,
      );
    if (myRegistrationList.length !== 0) {
      throw new HttpException(
        "your request already exists",
        HttpStatus.BAD_REQUEST,
      );
    }
    logger.debug(
      `[postRegistration] registration existence checked. ${clubRegistrationList} ${myRegistrationList}`,
    );
    // - foundedAt의 경우 가동아리 신청인 경우 설립연월의 정보가 처리됩니다. 신규등록|재등록인 경우 설립연도만을 처리합니다.
    const transformedBody = {
      ...body,
      foundedAt: await this.transformFoundedAt(
        body.foundedAt,
        body.registrationTypeEnumId,
      ),
    };
    // - 지도교수의 경우 기입시 신청, 미기입시 지도교수 없는 신청으로 처리됩니다.
    // - 존재하는 분과 id인지 검사합니다.
    const validateDivisionId =
      await this.divisionPublicService.findDivisionById(body.divisionId);
    if (!validateDivisionId)
      throw new HttpException("division not found", HttpStatus.NOT_FOUND);
    // - 제출한 file들이 유효한 fileId인지 검사합니다.
    const fileIds = [
      body.activityPlanFileId ? "activityPlanFileId" : null,
      body.clubRuleFileId ? "clubRuleFileId" : null,
      body.externalInstructionFileId ? "externalInstructionFileId" : null,
    ].filter(Boolean);
    await Promise.all(
      fileIds.map(key => this.filePublicService.getFileInfoById(body[key])),
    );
    // - 정동아리 재등록을 제외하고 활동계획서를 받아야합니다.
    await this.validateRegistration(
      studentId,
      body.clubId,
      body.registrationTypeEnumId,
    );

    const result = await this.clubRegistrationRepository.createRegistration(
      studentId,
      semesterId,
      transformedBody,
    );
    return result;
  }

  // 정동아리 재등록 신청
  async getStudentRegistrationClubRegistrationQualificationRenewal(
    studentId: number,
  ): Promise<ApiReg002ResponseOk> {
    await this.registrationPublicService.checkDeadline({
      enums: [RegistrationDeadlineEnum.ClubRegistrationApplication],
    });

    // student 가 delegate 저번 학기 인 동아리 가져오기
    const clubTemp =
      await this.clubPublicService.findStudentClubDelegate(studentId);

    const semester = await this.semesterPublicService.load();

    // delegate 인 동아리가 없을 경우
    if (!clubTemp) return { clubs: [] };

    const club = await this.clubPublicService.fetch(clubTemp.id, {
      id: semester.id - 1,
    });

    // 정동아리가 아닐 경우 return []
    if (club.typeEnum !== ClubTypeEnum.Regular) return { clubs: [] };

    // 데이터 조립
    const professor = club.professor
      ? await this.userPublicService.findProfessor(club.professor.id)
      : null;

    return {
      clubs: [
        {
          id: club.id,
          clubNameKr: club.nameKr,
          clubNameEn: club.nameEn,
          professor: professor
            ? {
                ...professor,
                professorEnumId: professor.professorEnum,
              }
            : null,
        },
      ],
    };
  }

  // 가동아리 재등록 신청 확인을 위해 저번 학기 동아리 가져오기
  async getStudentRegistrationClubRegistrationQualificationProvisionalRenewal(
    studentId: number,
  ): Promise<ApiReg018ResponseOk> {
    await this.registrationPublicService.checkDeadline({
      enums: [RegistrationDeadlineEnum.ClubRegistrationApplication],
    });

    // student 가 delegate 저번 학기 인 동아리 가져오기
    const clubTemp =
      await this.clubPublicService.findStudentClubDelegate(studentId);
    if (!clubTemp) {
      // 대표자 대의원이 아닌 경우에도 값을 보내주기 위한 처리
      return { clubs: [] };
    }
    const registeredSemesters =
      await this.clubPublicService.getClubsExistedSemesters({
        clubId: clubTemp.id,
      });

    const maxSemesterId = Math.max(...registeredSemesters.map(e => e.id));
    const club = await this.clubPublicService.fetch(clubTemp.id, {
      id: maxSemesterId,
    });

    // 없을 경우 return null
    if (!club) return { clubs: [] };

    // 데이터 조립
    const professor = club.professor
      ? await this.userPublicService.findProfessor(club.professor.id)
      : null;

    return {
      clubs: [
        {
          id: club.id,
          clubNameKr: club.nameKr,
          clubNameEn: club.nameEn,
          professor: professor
            ? {
                ...professor,
                professorEnumId: professor.professorEnum,
              }
            : null,
        },
      ],
    };
  }

  // 정동아리 신규 등록 신청을 위해 지난 동아리의 가장 최근의 정보를 받아옴
  async getStudentRegistrationClubRegistrationQualificationPromotional(
    studentId: number,
  ): Promise<ApiReg003ResponseOk> {
    await this.registrationPublicService.checkDeadline({
      enums: [RegistrationDeadlineEnum.ClubRegistrationApplication],
    });
    // student 가 delegate 인 동아리 가져오기
    const clubTmp =
      await this.clubPublicService.findStudentClubDelegate(studentId);
    const semester = await this.semesterPublicService.load();
    // 없을 경우 return null
    if (!clubTmp) return { clubs: [] };

    const clubId = clubTmp.id;

    const clubSummaryResponse =
      await this.clubPublicService.makeClubSummaryResponse({ id: clubId });

    const registeredSemesters =
      await this.clubPublicService.getClubsExistedSemesters({
        clubId,
      });

    const semesterMinusOne = registeredSemesters.some(
      e => e.id === semester.id - 1,
    )
      ? (
          await this.clubPublicService.getClubSummariesByClubIdAndSemesterIds(
            clubId,
            [semester.id - 1],
          )
        )[0]
      : null;

    const semesterMinusTwo = registeredSemesters.some(
      e => e.id === semester.id - 2,
    )
      ? (
          await this.clubPublicService.getClubSummariesByClubIdAndSemesterIds(
            clubId,
            [semester.id - 2],
          )
        )[0]
      : null;

    const semesterMinusThree = registeredSemesters.some(
      e => e.id === semester.id - 3,
    )
      ? (
          await this.clubPublicService.getClubSummariesByClubIdAndSemesterIds(
            clubId,
            [semester.id - 3],
          )
        )[0]
      : null;

    const promotionalProvisionalSemesters = [
      semesterMinusOne,
      semesterMinusTwo,
    ];

    // 정동아리였던 기록으로 신규등록
    const promotionalRegularSemesters = [semesterMinusTwo, semesterMinusThree];

    if (
      promotionalRegularSemesters.some(
        e => e && e.typeEnum === ClubTypeEnum.Regular,
      ) ||
      promotionalProvisionalSemesters.every(
        e => e && e.typeEnum === ClubTypeEnum.Provisional,
      )
    ) {
      // 데이터 조립
      const maxSemesterId = Math.max(...registeredSemesters.map(e => e.id));
      const club = await this.clubPublicService.fetch(clubId, {
        id: maxSemesterId,
      });
      const professor = club.professor
        ? await this.userPublicService.findProfessor(club.professor.id)
        : null;

      return {
        clubs: [
          {
            id: clubId,
            clubNameKr: clubSummaryResponse.name,
            clubNameEn: clubSummaryResponse.nameEn,
            professor: professor
              ? {
                  ...professor,
                  professorEnumId: professor.professorEnum,
                }
              : null,
          },
        ],
      };
    }
    return {
      clubs: [],
    };
  }

  /**
   * @description REG-001과 REG-009에서 공통적으로 검사하는 요소들에 대한 검사 메소드입니다.
   */
  private async validateRegistration(
    studentId: number,
    clubId: number | undefined,
    registrationTypeEnumId: number,
  ) {
    if (registrationTypeEnumId === RegistrationTypeEnum.NewProvisional) {
      // 가동아리 신규 신청 시 clubId는 undefined여야 함
      if (clubId !== undefined) {
        throw new HttpException(
          "[postRegistration] invalid club id. club id should be undefined",
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      // // 정동아리 재등록/신규 등록, 가동아리 재등록 신청 시 clubId가 정의되어 있어야 함
      // if (clubId === undefined) {
      //   throw new HttpException(
      //     "[postRegistration] invalid club id. club id should NOT be undefined",
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }
      switch (registrationTypeEnumId) {
        case RegistrationTypeEnum.Renewal: // 정동아리 재등록 신청
          if (
            !(
              await this.getStudentRegistrationClubRegistrationQualificationRenewal(
                studentId,
              )
            ).clubs.find(club => club.id === clubId)
          ) {
            // clubId가 목록에 포함되지 않았을 때의 처리
            throw new HttpException(
              "The clubId is not eligible for promotional registration",
              HttpStatus.BAD_REQUEST,
            );
          }
          break;
        case RegistrationTypeEnum.Promotional: // 정동아리 신규 등록 신청
          if (
            !(
              await this.getStudentRegistrationClubRegistrationQualificationPromotional(
                studentId,
              )
            ).clubs.find(club => club.id === clubId)
          ) {
            // clubId가 목록에 포함되지 않았을 때의 처리
            throw new HttpException(
              "The clubId is not eligible for promotional registration",
              HttpStatus.BAD_REQUEST,
            );
          }
          break;
        default:
          break;
      }
      await this.validateExistClub(clubId); // 기존에 존재하는지 club 확인
      logger.debug("[postRegistration] club existence checked");
    }
  }

  async validateExistClub(clubId: number) {
    // 신청 ClubId가 기존에 있는지 확인
    const clubList = await this.clubPublicService.getClubByClubId({ clubId });
    if (clubList.length !== 1) {
      throw new HttpException(
        "[postRegistration] club doesn't exist",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * @param foundedAt 설립일을 Date로 받습니다.
   * @param registrationTypeEnumId 등록 신청 유형에 따라 sanitization의 범위가 바뀝니다.
   * @returns 등록 신청 유형에 맞추어 설립일의 월일을 0으로 sanitizing 하여 리턴합니다.
   */
  private async transformFoundedAt(
    foundedAt: Date,
    registrationTypeEnumId: number,
  ) {
    const year = foundedAt.getUTCFullYear();
    const month =
      registrationTypeEnumId === RegistrationTypeEnum.NewProvisional
        ? foundedAt.getUTCMonth()
        : 0;
    const day =
      registrationTypeEnumId === RegistrationTypeEnum.NewProvisional ? 1 : 1;

    // 시간 부분을 00:00:00으로 설정
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  /**
   * @description studentId가 유효한지에 대한 검증은 repository쪽에서 진행됩니다.
   */
  async putStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
    body: ApiReg009RequestBody,
  ): Promise<ApiReg009ResponseOk> {
    // divisionId가 유효한지 확인
    const validateDivisionId =
      await this.divisionPublicService.findDivisionById(body.divisionId);
    if (!validateDivisionId)
      throw new HttpException("division not found", HttpStatus.NOT_FOUND);
    // 각각의 fileid들이 실제로 존재하는지 확인
    const fileIds = [
      body.activityPlanFileId ? "activityPlanFileId" : null,
      body.clubRuleFileId ? "clubRuleFileId" : null,
      body.externalInstructionFileId ? "externalInstructionFileId" : null,
    ].filter(Boolean);
    await Promise.all(
      fileIds.map(key => this.filePublicService.getFileInfoById(body[key])),
    );
    // 동아리 등록 기간인지 확인
    await this.registrationPublicService.checkDeadline({
      enums: [
        RegistrationDeadlineEnum.ClubRegistrationApplication,
        // RegistrationDeadlineEnum.ClubRegistrationModification,
      ],
    });
    const result =
      await this.clubRegistrationRepository.putStudentRegistrationsClubRegistration(
        studentId,
        applyId,
        body,
      );
    return result;
  }

  /**
   * @description studentId가 유효한지에 대한 검증은 repository쪽에서 진행됩니다.
   */
  async deleteStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg010ResponseOk> {
    // 동아리 신청, 집행부원 피드백, 동아리 수정 기간인지 확인합니다.
    await this.registrationPublicService.checkDeadline({
      enums: [
        RegistrationDeadlineEnum.ClubRegistrationApplication,
        // RegistrationDeadlineEnum.ClubRegistrationModification,
        // RegistrationDeadlineEnum.ClubRegistrationExecutiveFeedback,
      ],
    });
    await this.clubRegistrationRepository.deleteStudentRegistrationsClubRegistration(
      studentId,
      applyId,
    );
    return {};
  }

  /**
   * @description studentId가 유효한지에 대한 검증은 repository쪽에서 진행됩니다.
   */
  async getStudentRegistrationsClubRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg011ResponseOk> {
    // 동아리 신청, 집행부원 피드백, 동아리 수정 기간인지 확인합니다.
    // await this.registrationPublicService.checkDeadline({
    //   enums: [
    //     RegistrationDeadlineEnum.ClubRegistrationApplication,
    //     // RegistrationDeadlineEnum.ClubRegistrationModification,
    //     // RegistrationDeadlineEnum.ClubRegistrationExecutiveFeedback,
    //   ],
    // });
    const result =
      await this.clubRegistrationRepository.getStudentRegistrationsClubRegistration(
        studentId,
        applyId,
      );
    if (result.externalInstructionFile) {
      result.externalInstructionFile.url =
        await this.filePublicService.getFileUrl(
          result.externalInstructionFile.id,
        );
    }
    if (result.clubRuleFile) {
      result.clubRuleFile.url = await this.filePublicService.getFileUrl(
        result.clubRuleFile.id,
      );
    }
    if (result.activityPlanFile) {
      result.activityPlanFile.url = await this.filePublicService.getFileUrl(
        result.activityPlanFile.id,
      );
    }
    return result;
  }

  /**
   * @description studentId가 유효한지에 대한 검증은 repository쪽에서 진행됩니다.
   */
  async getStudentRegistrationsClubRegistrationsMy(
    studentId: number,
  ): Promise<ApiReg012ResponseOk> {
    // 동아리 신청, 집행부원 피드백, 동아리 수정 기간인지 확인합니다.
    // await this.registrationPublicService.checkDeadline({
    //   enums: [
    //     RegistrationDeadlineEnum.ClubRegistrationApplication,
    //     // RegistrationDeadlineEnum.ClubRegistrationModification,
    //     // RegistrationDeadlineEnum.ClubRegistrationExecutiveFeedback,
    //   ],
    // });

    const semesterId = await this.semesterPublicService.loadId();

    const result =
      await this.clubRegistrationRepository.getStudentRegistrationsClubRegistrationsMy(
        studentId,
        semesterId,
      );
    return result;
  }

  async getExecutiveRegistrationsClubRegistrations(
    pageOffset: number,
    itemCount: number,
  ): Promise<ApiReg014ResponseOk> {
    const result =
      await this.clubRegistrationRepository.getRegistrationsClubRegistrations(
        pageOffset,
        itemCount,
      );
    return result;
  }

  async getStudentRegistrationsClubRegistrations(
    pageOffset: number,
    itemCount: number,
  ): Promise<ApiReg024ResponseOk> {
    const result =
      await this.clubRegistrationRepository.getRegistrationsClubRegistrations(
        pageOffset,
        itemCount,
      );
    return result;
  }

  async getExecutiveRegistrationsClubRegistration(
    applyId: number,
  ): Promise<ApiReg015ResponseOk> {
    const result =
      await this.clubRegistrationRepository.getExecutiveRegistrationsClubRegistration(
        applyId,
      );
    if (result.externalInstructionFile) {
      result.externalInstructionFile.url =
        await this.filePublicService.getFileUrl(
          result.externalInstructionFile.id,
        );
    }
    if (result.clubRuleFile) {
      result.clubRuleFile.url = await this.filePublicService.getFileUrl(
        result.clubRuleFile.id,
      );
    }
    if (result.activityPlanFile) {
      result.activityPlanFile.url = await this.filePublicService.getFileUrl(
        result.activityPlanFile.id,
      );
    }
    return result;
  }

  async patchExecutiveRegistrationsClubRegistrationApproval(
    applyId: number,
  ): Promise<ApiReg016ResponseOk> {
    // 동아리 신청, 집행부원 피드백, 동아리 수정 기간인지 확인합니다.
    await this.registrationPublicService.checkDeadline({
      enums: [
        RegistrationDeadlineEnum.ClubRegistrationApplication,
        // RegistrationDeadlineEnum.ClubRegistrationModification,
        // RegistrationDeadlineEnum.ClubRegistrationExecutiveFeedback,
      ],
    });
    const result =
      await this.clubRegistrationRepository.patchExecutiveRegistrationsClubRegistrationApproval(
        applyId,
      );
    return result;
  }

  async postExecutiveRegistrationsClubRegistrationSendBack(
    applyId: number,
    executiveId: number,
    comment: string,
  ): Promise<ApiReg017ResponseCreated> {
    // 동아리 신청, 집행부원 피드백, 동아리 수정 기간인지 확인합니다.
    await this.registrationPublicService.checkDeadline({
      enums: [
        RegistrationDeadlineEnum.ClubRegistrationApplication,
        // RegistrationDeadlineEnum.ClubRegistrationModification,
        // RegistrationDeadlineEnum.ClubRegistrationExecutiveFeedback,
      ],
    });
    const result =
      await this.clubRegistrationRepository.postExecutiveRegistrationsClubRegistrationSendBack(
        applyId,
        executiveId,
        comment,
      );
    return result;
  }

  /**
   * @param para
   * @description getProfessorRegistrationsClubRegistrationsBrief의 진입점입니다.
   */
  async getProfessorRegistrationsClubRegistrationsBrief(param: {
    professorId: number;
  }): Promise<ApiReg021ResponseOk> {
    const result =
      await this.clubRegistrationRepository.selectRegistrationsAndRepresentativeByProfessorId(
        {
          professorId: param.professorId,
        },
      );
    logger.debug(result);
    const registrations = result.sort((a, b) => {
      if (a.registration.divisionId !== b.registration.divisionId)
        return a.registration.divisionId - b.registration.divisionId;
      return a.registration.clubNameKr > b.registration.clubNameKr ? 1 : -1;
    });
    logger.debug(registrations);
    return {
      items: registrations.map(e => ({
        id: e.registration.id,
        clubId: e.registration.clubId,
        registrationStatusEnumId:
          e.registration.registrationApplicationStatusEnumId,
        division: {
          id: e.registration.divisionId,
          name: e.division.name,
        },
        clubNameKr: e.club.nameKr,
        newClubNameKr: e.registration.clubNameKr,
        clubNameEn: e.club.nameEn,
        newClubNameEn: e.registration.clubNameEn,
        student: {
          id: e.student.id,
          studentNumber: e.student.number,
          name: e.student.name,
          phoneNumber: e.user.phoneNumber,
          email: e.student.email,
        },
        professorSignedAt: e.registration.professorApprovedAt,
      })),
    };
  }

  /**
   * @param para
   * @description getProfessorRegistrationsClubRegistration 서비스 진입점입니다.
   */
  async getProfessorRegistrationsClubRegistration(param: {
    registrationId: number;
    professorId: number;
  }): Promise<ApiReg022ResponseOk> {
    // 동아리 등록 기간인지 검사합니다.
    await this.registrationPublicService.checkDeadline({
      enums: [
        RegistrationDeadlineEnum.ClubRegistrationApplication,
        // RegistrationDeadlineEnum.ClubRegistrationModification,
        // RegistrationDeadlineEnum.ClubRegistrationExecutiveFeedback,
      ],
    });

    const result =
      await this.clubRegistrationRepository.getProfessorRegistrationsClubRegistration(
        {
          registrationId: param.registrationId,
          professorId: param.professorId,
        },
      );
    const activityPlanFile =
      result.registration.registrationActivityPlanFileId !== null
        ? {
            name: await this.filePublicService
              .getFileInfoById(
                result.registration.registrationActivityPlanFileId,
              )
              .then(e => e.name),
            url: await this.filePublicService.getFileUrl(
              result.registration.registrationActivityPlanFileId,
            ),
          }
        : undefined;
    const clubRuleFile =
      result.registration.registrationClubRuleFileId !== null
        ? {
            name: await this.filePublicService
              .getFileInfoById(result.registration.registrationClubRuleFileId)
              .then(e => e.name),
            url: await this.filePublicService.getFileUrl(
              result.registration.registrationClubRuleFileId,
            ),
          }
        : undefined;
    const externalInstructionFile =
      result.registration.registrationExternalInstructionFileId !== null
        ? {
            name: await this.filePublicService
              .getFileInfoById(
                result.registration.registrationExternalInstructionFileId,
              )
              .then(e => e.name),
            url: await this.filePublicService.getFileUrl(
              result.registration.registrationExternalInstructionFileId,
            ),
          }
        : undefined;

    return {
      id: result.registration.id,
      registrationTypeEnumId:
        result.registration.registrationApplicationTypeEnumId,
      registrationStatusEnumId:
        result.registration.registrationApplicationStatusEnumId,
      clubId: result.registration.clubId,
      clubNameKr: result.club.nameKr,
      clubNameEn: result.club.nameEn,
      newClubNameKr: result.registration.clubNameKr,
      newClubNameEn: result.registration.clubNameEn,
      representative: {
        studentNumber: result.student.number,
        name: result.student.name,
        phoneNumber: result.registration.phoneNumber,
      },
      foundedAt: result.registration.foundedAt,
      divisionId: result.registration.divisionId,
      activityFieldKr: result.registration.activityFieldKr,
      activityFieldEn: result.registration.activityFieldEn,
      professor: {
        name: result.professor.name,
        email: result.professor.email,
        professorEnumId: result.professor_t.professorEnum,
      },
      divisionConsistency: result.registration.divisionConsistency,
      foundationPurpose: result.registration.foundationPurpose,
      activityPlan: result.registration.activityPlan,
      activityPlanFile:
        result.registration.registrationActivityPlanFileId !== null
          ? {
              id: result.registration.registrationActivityPlanFileId,
              ...activityPlanFile,
            }
          : undefined,
      clubRuleFile:
        result.registration.registrationClubRuleFileId !== null
          ? {
              id: result.registration.registrationClubRuleFileId,
              ...clubRuleFile,
            }
          : undefined,
      externalInstructionFile:
        result.registration.registrationExternalInstructionFileId !== null
          ? {
              id: result.registration.registrationExternalInstructionFileId,
              ...externalInstructionFile,
            }
          : undefined,
      isProfessorSigned:
        result.registration.professorApprovedAt !== undefined &&
        result.registration.professorApprovedAt !== null,
      updatedAt: result.registration.updatedAt,
      comments: result.comments.map(e => ({
        content: e.content,
        createdAt: e.createdAt,
      })),
    };
  }

  /**
   * @description getProfessorRegistrationsClubRegistrationApproval 의 서비스 진입점입니다.
   */
  async getProfessorRegistrationsClubRegistrationApproval(param: {
    professorId: number;
    param: ApiReg023RequestParam;
  }): Promise<ApiReg023ResponseOk> {
    // 현재 동아리 등록 기간인지 검사합니다.
    await this.registrationPublicService.checkDeadline({
      enums: [
        RegistrationDeadlineEnum.ClubRegistrationApplication,
        // RegistrationDeadlineEnum.ClubRegistrationModification,
        // RegistrationDeadlineEnum.ClubRegistrationExecutiveFeedback,
      ],
    });

    const registrations =
      await this.clubRegistrationRepository.selectRegistrationsById({
        registrationId: param.param.applyId,
      });
    if (registrations.length > 1)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
    if (registrations.length === 0)
      throw new HttpException(
        "no such registration-apply",
        HttpStatus.NOT_FOUND,
      );
    // 해당 동아라의 등록 신청서상의 이번학기 지도교수가 professorId와 일치하는지 검사합니다.
    if (registrations[0].professorId !== param.professorId)
      throw new HttpException(
        "It seems that you are not a advisor of the club",
        HttpStatus.BAD_REQUEST,
      );
    // 해당 신청이 서명대기 상태인지 검사합니다. 쿼리가 null을주는것 같아 둘다 넣어두었어요.
    logger.debug(registrations[0].professorApprovedAt);
    if (
      registrations[0].professorApprovedAt !== undefined &&
      registrations[0].professorApprovedAt !== null
    )
      throw new HttpException(
        "It seems already approved",
        HttpStatus.BAD_REQUEST,
      );

    // 동아리 신청에 서명합니다.
    await this.clubRegistrationRepository.updateRegistrationProfessorApprovedAt(
      {
        registrationId: param.param.applyId,
        approvedAt: new Date(),
      },
    );

    return {};
  }

  async getStudentRegistrationsAvailableClub(
    studentId: IStudent["id"],
  ): Promise<ApiReg025ResponseOk> {
    // student 가 delegate 인 동아리 가져오기
    const clubTmp =
      await this.clubPublicService.findStudentClubDelegate(studentId);
    const semester = await this.semesterPublicService.load();
    // 없을 경우 return null
    if (!clubTmp) return { club: null };

    // 있을 경우 해당 동아리의 이번 등록 여부 조회
    const clubId = clubTmp.id;
    const registrations =
      await this.clubRegistrationRepository.findByClubAndSemesterId(
        clubId,
        semester.id,
      );

    const clubSummaryResponse =
      await this.clubPublicService.makeClubSummaryResponse({ id: clubId });

    if (registrations.length > 0) {
      return {
        club: {
          ...clubSummaryResponse,
          availableRegistrationTypeEnums: [],
        },
      };
    }

    const registeredSemesters =
      await this.clubPublicService.getClubsExistedSemesters({
        clubId,
      });

    const semesterMinusOne = registeredSemesters.some(
      e => e.id === semester.id - 1,
    )
      ? (
          await this.clubPublicService.getClubSummariesByClubIdAndSemesterIds(
            clubId,
            [semester.id - 1],
          )
        )[0]
      : null;

    const semesterMinusTwo = registeredSemesters.some(
      e => e.id === semester.id - 2,
    )
      ? (
          await this.clubPublicService.getClubSummariesByClubIdAndSemesterIds(
            clubId,
            [semester.id - 2],
          )
        )[0]
      : null;

    const semesterMinusThree = registeredSemesters.some(
      e => e.id === semester.id - 3,
    )
      ? (
          await this.clubPublicService.getClubSummariesByClubIdAndSemesterIds(
            clubId,
            [semester.id - 3],
          )
        )[0]
      : null;

    const promotionalProvisionalSemesters = [
      semesterMinusOne,
      semesterMinusTwo,
    ];

    // 정동아리였던 기록으로 신규등록
    const promotionalRegularSemesters = [semesterMinusTwo, semesterMinusThree];

    const availableRegistrationTypeEnums = [
      semesterMinusOne && semesterMinusOne.typeEnum === ClubTypeEnum.Regular
        ? RegistrationTypeEnum.Renewal
        : null,
      promotionalRegularSemesters.some(
        e => e && e.typeEnum === ClubTypeEnum.Regular,
      ) ||
      promotionalProvisionalSemesters.every(
        e => e && e.typeEnum === ClubTypeEnum.Provisional,
      )
        ? RegistrationTypeEnum.Promotional
        : null,
      semesterMinusOne ? RegistrationTypeEnum.ReProvisional : null,
    ].filter(Boolean);

    return {
      club: {
        ...clubSummaryResponse,
        availableRegistrationTypeEnums,
      },
    };
  }

  async getClubRegistrationDeadline(): Promise<ApiReg027ResponseOk> {
    const today = new Date();
    const semester = await this.semesterPublicService.load();
    // TODO: 현재는 정규 기간만 제시함. 나중에 late도 구현할 경우 수정
    const deadline = await this.registrationDeadlinePublicService.load({
      deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
      date: today,
    });

    return {
      semester: {
        id: semester.id,
        year: semester.year,
        name: semester.name,
        startTerm: semester.startTerm,
        endTerm: semester.endTerm,
      },
      deadline:
        deadline.startTerm <= today && today <= deadline.endTerm
          ? {
              startDate: deadline.startTerm,
              endTerm: deadline.endTerm,
            }
          : null,
    };
  }

  async postMemberRegistration(
    studentId: number,
    clubId: number,
  ): Promise<ApiReg005ResponseCreated> {
    // 현재 회원등록 신청 기간인지 확인하기
    await this.registrationDeadlinePublicService.validate({
      deadlineEnum: RegistrationDeadlineEnum.StudentRegistrationApplication,
    });

    // 해당 학생이 신청 자격이 존재하는지 확인하기
    const semesterId = await this.semesterPublicService.loadId();
    if (semesterId === undefined)
      throw new HttpException(
        "Semester Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const ismemberRegistrationAvailable =
      await this.userPublicService.isNotGraduateStudent(studentId, semesterId);
    if (!ismemberRegistrationAvailable)
      throw new HttpException(
        "Not a member registration available",
        HttpStatus.BAD_REQUEST,
      );

    // 해당 동아리가 존재하는지 확인
    const club = await this.clubPublicService.getClubByClubId({ clubId });
    if (club.length === 0) {
      throw new HttpException("The club does not exist.", HttpStatus.NOT_FOUND);
    }

    // 해당 동아리가 이번 학기에 활동중이어서 신청이 가능한 지 확인
    const clubExistedSemesters =
      await this.clubPublicService.getClubsExistedSemesters({ clubId });
    const isClubOperatingThisSemester = clubExistedSemesters.some(
      semester => semester.id === semesterId,
    );
    if (!isClubOperatingThisSemester) {
      throw new HttpException(
        "The club is not operating in the current semester.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 이미 해당 동아리 학생인지 확인하기
    const isAlreadyMember = await this.clubPublicService.isStudentBelongsTo(
      studentId,
      clubId,
    );
    if (isAlreadyMember)
      throw new HttpException("Already a member", HttpStatus.BAD_REQUEST);

    // 이미 해당 동아리에 해당 학생의 신청이 존재하는지 확인하기
    const isAlreadyApplied = await this.memberRegistrationRepository.find({
      studentId,
      clubId,
      semesterId,
    });
    if (isAlreadyApplied.length > 0)
      throw new HttpException("Already applied", HttpStatus.BAD_REQUEST);

    // 동아리 가입 신청
    await this.memberRegistrationRepository.create([
      {
        student: { id: studentId },
        club: { id: clubId },
        semester: { id: semesterId },
        registrationApplicationStudentEnum:
          RegistrationApplicationStudentStatusEnum.Pending,
      },
    ]);
    return {};
  }

  async getMemberRegistrationsMy(
    studentId: number,
  ): Promise<ApiReg006ResponseType> {
    // const ismemberRegistrationEvent =
    //   await this.memberRegistrationRepository.isMemberRegistrationEvent();
    // if (!ismemberRegistrationEvent)
    //   return { status: HttpStatus.NO_CONTENT, data: { applies: [] } };
    const semesterId = await this.semesterPublicService.loadId();
    if (semesterId === undefined)
      throw new HttpException(
        "Semester Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const registrations = await this.memberRegistrationRepository.find({
      studentId,
      semesterId,
    });

    const result = await Promise.all(
      registrations.map(async registration => {
        const club = await this.clubPublicService.fetchSummary(
          registration.club.id,
        );
        //todo club summary에서 division의 name까지 추가해주면 안되나?
        const division = await this.divisionPublicService
          .getDivisionById({
            id: club.division.id,
          })
          .then(takeOne);
        return {
          id: registration.id,
          clubId: club.id,
          clubNameKr: club.name,
          type: club.typeEnum,
          isPermanent: await this.clubPublicService.isPermanentClubsByClubId(
            club.id,
          ),
          divisionName: division.name,
          applyStatusEnumId: registration.registrationApplicationStudentEnum,
        };
      }),
    );
    return { status: HttpStatus.OK, data: { applies: result } };
  }

  async deleteMemberRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg013ResponseOk> {
    // const ismemberRegistrationEvent =
    //   await this.memberRegistrationRepository.isMemberRegistrationEvent();
    // if (!ismemberRegistrationEvent)
    //   throw new HttpException(
    //     "Not a member registration event duration",
    //     HttpStatus.BAD_REQUEST,
    //   );

    const application = await this.memberRegistrationRepository
      .find({
        id: applyId,
      })
      .then(takeOnlyOne("MemberRegistration"));

    if (
      this.clubPublicService.isStudentBelongsTo(studentId, application.club.id)
    ) {
      // 만약 동아리원인 경우 삭제
      this.clubPublicService.removeStudentFromClub(
        studentId,
        application.club.id,
      );
    }

    await this.memberRegistrationRepository.delete({ id: applyId });
    return {};
  }

  async patchMemberRegistration(
    studentId: number,
    applyId: number,
    clubId: number,
    applyStatusEnumId: number,
  ): Promise<ApiReg007ResponseNoContent> {
    if (
      applyStatusEnumId !== RegistrationApplicationStudentStatusEnum.Approved &&
      applyStatusEnumId !== RegistrationApplicationStudentStatusEnum.Rejected
    )
      throw new HttpException("Invalid status enum", HttpStatus.BAD_REQUEST);
    const isDelegate = await this.clubPublicService.isStudentDelegate(
      studentId,
      clubId,
    );
    if (!isDelegate)
      throw new HttpException("Not a club delegate", HttpStatus.FORBIDDEN);
    // const ismemberRegistrationEvent =
    //   await this.memberRegistrationRepository.isMemberRegistrationEvent();
    // if (!ismemberRegistrationEvent)
    //   throw new HttpException(
    //     "Not a member registration event duration",
    //     HttpStatus.BAD_REQUEST,
    //   );

    const application = await this.memberRegistrationRepository.find({
      id: applyId,
    });
    if (!application) {
      throw new HttpException("Application not found", HttpStatus.NOT_FOUND);
    }

    const applicationStudentId = application[0].student.id;
    const isAlreadyMember = await this.clubPublicService.isStudentBelongsTo(
      applicationStudentId, // 동아리 가입 신청 내부의 studentId 사용
      clubId,
    );

    if (
      applyStatusEnumId === RegistrationApplicationStudentStatusEnum.Approved
    ) {
      if (isAlreadyMember)
        throw new HttpException(
          "student is already belongs to this club",
          HttpStatus.BAD_REQUEST,
        );
      else
        await this.clubPublicService.addStudentToClub(
          applicationStudentId,
          clubId,
        );
    } else if (
      applyStatusEnumId === RegistrationApplicationStudentStatusEnum.Rejected
    ) {
      const isAplicatedStudentDelegate =
        await this.clubPublicService.isStudentDelegate(
          applicationStudentId,
          clubId,
        );
      if (isAplicatedStudentDelegate)
        throw new HttpException(
          "club delegate cannot be rejected",
          HttpStatus.BAD_REQUEST,
        );
      else
        await this.clubPublicService.removeStudentFromClub(
          applicationStudentId,
          clubId,
        );
    }
    await this.memberRegistrationRepository.patch(
      { id: applyId },
      newbie =>
        new MMemberRegistration({
          ...newbie,
          registrationApplicationStudentEnum: applyStatusEnumId,
        }),
    );
    return {};
  }

  async getMemberRegistrationsClub(
    studentId: number,
    clubId: number,
  ): Promise<ApiReg008ResponseOk> {
    const isDelegate = await this.clubPublicService.isStudentDelegate(
      studentId,
      clubId,
    );
    if (!isDelegate)
      throw new HttpException("Not a club delegate", HttpStatus.FORBIDDEN);
    // const ismemberRegistrationEvent =
    //   await this.memberRegistrationRepository.isMemberRegistrationEvent();
    // if (!ismemberRegistrationEvent)
    //   throw new HttpException(
    //     "Not a member registration event duration",
    //     HttpStatus.BAD_REQUEST,
    //   );
    const semesterId = await this.semesterPublicService.loadId();
    if (semesterId === undefined)
      throw new HttpException(
        "Semester Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const registrations = await this.memberRegistrationRepository.find({
      clubId,
      semesterId,
    });
    const result = await Promise.all(
      registrations.map(async registration => ({
        id: registration.id,
        applyStatusEnumId: registration.registrationApplicationStudentEnum,
        createdAt: registration.createdAt,
        student: await this.userPublicService.getStudentById(
          registration.student,
        ),
      })),
    );
    return {
      applies: result.map(r => ({
        id: r.id,
        applyStatusEnumId: r.applyStatusEnumId,
        createdAt: r.createdAt,
        student: {
          id: r.student.id,
          name: r.student.name,
          studentNumber: r.student.number,
          email: r.student.email,
          phoneNumber: r.student.phoneNumber,
        },
      })),
    };
  }

  async getExecutiveRegistrationsMemberRegistrations(param: {
    executiveId: number;
    query: ApiReg020RequestQuery;
  }): Promise<ApiReg020ResponseOk> {
    const semesterId = await this.semesterPublicService.loadId();
    // logger.debug(semesterId);
    const [registrations, total] = await Promise.all([
      this.memberRegistrationRepository.find({
        clubId: param.query.clubId,
        semesterId,
        pagination: {
          offset: param.query.pageOffset,
          itemCount: param.query.itemCount,
        },
        orderBy: {
          createdAt: OrderByTypeEnum.DESC,
        },
      }),
      this.memberRegistrationRepository.count({
        clubId: param.query.clubId,
        semesterId,
      }),
    ]);
    const memberRegistrations = await Promise.all(
      registrations.map(async registration => ({
        id: registration.id,
        registrationApplicationStudentEnum:
          registration.registrationApplicationStudentEnum,
        createdAt: registration.createdAt,
        student: {
          ...(await this.userPublicService.getStudentById(
            registration.student,
          )),
          StudentEnumId:
            await this.userPublicService.getStudentStatusEnumIdByStudentIdSemesterId(
              registration.student.id,
              semesterId,
            ),
        },
      })),
    );
    return {
      totalRegistrations: memberRegistrations.length,
      totalWaitings: memberRegistrations.filter(
        e =>
          e.registrationApplicationStudentEnum ===
          RegistrationApplicationStudentStatusEnum.Pending,
      ).length,
      totalApprovals: memberRegistrations.filter(
        e =>
          e.registrationApplicationStudentEnum ===
          RegistrationApplicationStudentStatusEnum.Approved,
      ).length,
      totalRejections: memberRegistrations.filter(
        e =>
          e.registrationApplicationStudentEnum ===
          RegistrationApplicationStudentStatusEnum.Rejected,
      ).length,
      regularMemberRegistrations: memberRegistrations.filter(
        e => e.student.StudentEnumId === 1,
      ).length,
      regularMemberApprovals: memberRegistrations.filter(
        e =>
          e.student.StudentEnumId === 1 &&
          e.registrationApplicationStudentEnum ===
            RegistrationApplicationStudentStatusEnum.Approved,
      ).length,
      regularMemberWaitings: memberRegistrations.filter(
        e =>
          e.student.StudentEnumId === 1 &&
          e.registrationApplicationStudentEnum ===
            RegistrationApplicationStudentStatusEnum.Pending,
      ).length,
      regularMemberRejections: memberRegistrations.filter(
        e =>
          e.student.StudentEnumId === 1 &&
          e.registrationApplicationStudentEnum ===
            RegistrationApplicationStudentStatusEnum.Rejected,
      ).length,
      items: memberRegistrations.map(e => ({
        memberRegistrationId: e.id,
        RegistrationApplicationStudentStatusEnumId:
          e.registrationApplicationStudentEnum,
        isRegularMemberRegistration: e.student.StudentEnumId === 1,
        student: {
          id: e.student.id,
          studentNumber: e.student.number,
          name: e.student.name,
          phoneNumber:
            e.student.phoneNumber === null ? undefined : e.student.phoneNumber,
          email: e.student.email,
        },
      })),
      total,
      offset: param.query.pageOffset,
    };
  }

  /**
   * @description getExecutiveRegistrationsMemberRegistrations의
   * 서비스 진입점입니다.
   * 굉장히 못짠 코드이니 언젠가 누군가 고쳐주세요... 참고하지 말아주세요...
   */
  async getExecutiveRegistrationsMemberRegistrationsBrief(param: {
    executiveId: number;
    query: ApiReg019RequestQuery;
  }): Promise<ApiReg019ResponseOk> {
    const semesterId = await this.semesterPublicService.loadId();
    // logger.debug(semesterId);
    const registrations = await this.memberRegistrationRepository.find({
      semesterId,
    });

    const [divisions, studentEnums] = await Promise.all([
      this.divisionPublicService.getCurrentDivisions(),
      this.userPublicService.getStudentEnumsByIdsAndSemesterId(
        registrations.map(e => e.student.id),
        semesterId,
      ),
    ]);

    const clubIds = registrations.reduce((acc: number[], registration) => {
      if (!acc.includes(registration.club.id)) {
        acc.push(registration.club.id);
      }
      return acc;
    }, []);
    const clubIdSummaryIsPermanentDivisionTuples = await Promise.all(
      clubIds.map(async clubId => {
        const club = await this.clubPublicService.fetchSummary(clubId);
        const isPermanent =
          await this.clubPublicService.isPermanentClubsByClubId(club.id);
        const division = divisions.find(e => e.id === club.division.id);

        return {
          clubId,
          club,
          isPermanent,
          division,
        };
      }),
    );

    const memberRegistrations = await Promise.all(
      registrations.map(async registration => {
        const { club, isPermanent, division } =
          clubIdSummaryIsPermanentDivisionTuples.find(
            e => e.clubId === registration.club.id,
          );
        //todo club summary에서 division의 name까지 추가해주면 안되나?
        return {
          id: registration.id,
          clubId: club.id,
          clubNameKr: club.name,
          type: club.typeEnum,
          isPermanent,
          division,
          studentEnum: studentEnums.find(e => e.id === registration.student.id),
          registrationApplicationStudentEnum:
            registration.registrationApplicationStudentEnum,
        };
      }),
    );
    // logger.debug(memberRegistrations);
    const clubs = memberRegistrations
      .filter(
        (item, pos) =>
          memberRegistrations.findIndex(e2 => e2.clubId === item.clubId) ===
          pos,
      )
      .map(e => ({
        clubId: e.clubId,
        clubName: e.clubNameKr,
        clubTypeEnumId: e.type,
        isPermanent: e.isPermanent,
        division: e.division,
      }));
    const totalItems = clubs.map(e => ({
      ...e,
      totalRegistrations: memberRegistrations.filter(
        e2 => e2.clubId === e.clubId,
      ).length,
      // 정회원의 enum이 1이라고 가정
      regularMemberRegistrations: memberRegistrations.filter(
        e2 => e2.studentEnum.studentEnumId === 1 && e2.clubId === e.clubId,
      ).length,
      totalApprovals: memberRegistrations.filter(
        e2 =>
          e2.clubId === e.clubId &&
          e2.registrationApplicationStudentEnum ===
            RegistrationApplicationStudentStatusEnum.Approved,
      ).length,
      regularMemberApprovals: memberRegistrations.filter(
        e2 =>
          e2.studentEnum.studentEnumId === 1 &&
          e2.clubId === e.clubId &&
          e2.registrationApplicationStudentEnum ===
            RegistrationApplicationStudentStatusEnum.Approved,
      ).length,
    }));

    return {
      total: totalItems.length,
      items: totalItems.slice(
        // TODO: 나중에 쿼리 자체 변경 필요
        (param.query.pageOffset - 1) * param.query.itemCount,
        param.query.pageOffset * param.query.itemCount,
      ),
      offset: param.query.pageOffset,
    };
  }

  async getClubMemberRegistrationCount(
    clubId: number,
  ): Promise<ApiReg026ResponseOk> {
    // 기간 확인 해야 하나? 일단 스킵
    const semesterId = await this.semesterPublicService.loadId();
    const result = await this.memberRegistrationRepository.count({
      clubId,
      semesterId,
    });
    return {
      clubId,
      semesterId,
      totalMemberRegistrationCount: result,
    };
  }

  async getMemberRegistrationDeadline(): Promise<ApiReg028ResponseOk> {
    const today = new Date();
    const semester = await this.semesterPublicService.load();
    // TODO: 현재는 정규 기간만 제시함. 나중에 late도 받도록 구현할 경우 수정
    const deadline = await this.registrationDeadlinePublicService.load({
      deadlineEnum: RegistrationDeadlineEnum.StudentRegistrationApplication,
      date: today,
    });
    return {
      semester: {
        id: semester.id,
        year: semester.year,
        name: semester.name,
        startTerm: semester.startTerm,
        endTerm: semester.endTerm,
      },
      deadline:
        deadline.startTerm <= today && today <= deadline.endTerm
          ? {
              startDate: deadline.startTerm,
              endTerm: deadline.endTerm,
            }
          : null,
    };
  }
}
