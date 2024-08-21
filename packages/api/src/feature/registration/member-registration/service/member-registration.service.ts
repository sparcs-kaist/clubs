import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ApiReg005ResponseCreated } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";
import {
  ApiReg006ResponseNoContent,
  ApiReg006ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";

import { ApiReg007ResponseNoContent } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg007";
import { ApiReg008ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";
import { ApiReg013ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg013";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { MemberRegistrationRepository } from "../repository/member-registration.repository";

interface ApiReg006ResponseType {
  status: number;
  data: ApiReg006ResponseOk | ApiReg006ResponseNoContent;
}
@Injectable()
export class MemberRegistrationService {
  constructor(
    private readonly memberRegistrationRepository: MemberRegistrationRepository,
    private readonly clubPublicService: ClubPublicService,
    private readonly userPublicService: UserPublicService,
  ) {}

  async postStudentMemberRegistration(
    studentId: number,
    clubId: number,
  ): Promise<ApiReg005ResponseCreated> {
    // 현재 회원등록 신청 기간인지 확인하기
    const ismemberRegistrationEvent =
      await this.memberRegistrationRepository.isMemberRegistrationEvent();
    if (!ismemberRegistrationEvent)
      throw new HttpException(
        "Not a member registration event duration",
        HttpStatus.BAD_REQUEST,
      );
    // 해당 학생이 신청 자격이 존재하는지 확인하기
    const cur = getKSTDate();
    const semesterId = await this.clubPublicService.dateToSemesterId(cur);
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
    // 이미 해당 동아리에 해당 학생의 반려되지 않은 신청이 존재하는지 확인하기
    const isAlreadyApplied =
      await this.memberRegistrationRepository.getMemberClubRegistrationExceptRejected(
        studentId,
        clubId,
      );
    if (!isAlreadyApplied)
      throw new HttpException("Already applied", HttpStatus.BAD_REQUEST);
    // 동아리 가입 신청
    const createRegistration =
      await this.memberRegistrationRepository.postMemberRegistration(
        studentId,
        clubId,
      );
    return createRegistration;
  }

  async getStudentRegistrationsMemberRegistrationsMy(
    studentId: number,
  ): Promise<ApiReg006ResponseType> {
    const ismemberRegistrationEvent =
      await this.memberRegistrationRepository.isMemberRegistrationEvent();
    if (!ismemberRegistrationEvent)
      return { status: HttpStatus.NO_CONTENT, data: { applies: [] } };
    const result =
      await this.memberRegistrationRepository.getStudentRegistrationsMemberRegistrationsMy(
        studentId,
      );
    return { status: HttpStatus.OK, data: result };
  }

  async deleteStudentRegistrationsMemberRegistration(
    studentId: number,
    applyId: number,
  ): Promise<ApiReg013ResponseOk> {
    const ismemberRegistrationEvent =
      await this.memberRegistrationRepository.isMemberRegistrationEvent();
    if (!ismemberRegistrationEvent)
      throw new HttpException(
        "Not a member registration event duration",
        HttpStatus.BAD_REQUEST,
      );
    const result =
      await this.memberRegistrationRepository.deleteMemberRegistration(
        studentId,
        applyId,
      );
    return result;
  }

  async patchStudentRegistrationsMemberRegistration(
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
    const ismemberRegistrationEvent =
      await this.memberRegistrationRepository.isMemberRegistrationEvent();
    if (!ismemberRegistrationEvent)
      throw new HttpException(
        "Not a member registration event duration",
        HttpStatus.BAD_REQUEST,
      );

    if (applyStatusEnumId === RegistrationApplicationStudentStatusEnum.Approved)
      await this.clubPublicService.addStudentToClub(studentId, clubId);
    else if (
      applyStatusEnumId === RegistrationApplicationStudentStatusEnum.Rejected
    )
      if (isDelegate)
        throw new HttpException(
          "club delegate cannot be rejected",
          HttpStatus.BAD_REQUEST,
        );
    await this.clubPublicService.removeStudentFromClub(studentId, clubId);

    const result =
      await this.memberRegistrationRepository.patchMemberRegistration(
        applyId,
        clubId,
        applyStatusEnumId,
      );
    return result;
  }

  async getStudentRegistrationsMemberRegistrationsClub(
    studentId: number,
    clubId: number,
  ): Promise<ApiReg008ResponseOk> {
    const isDelegate = await this.clubPublicService.isStudentDelegate(
      studentId,
      clubId,
    );
    if (!isDelegate)
      throw new HttpException("Not a club delegate", HttpStatus.FORBIDDEN);
    const ismemberRegistrationEvent =
      await this.memberRegistrationRepository.isMemberRegistrationEvent();
    if (!ismemberRegistrationEvent)
      throw new HttpException(
        "Not a member registration event duration",
        HttpStatus.BAD_REQUEST,
      );
    const result =
      await this.memberRegistrationRepository.getMemberRegistrationClub(clubId);
    return result;
  }
}
