import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ApiReg005ResponseCreated } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";
import {
  ApiReg006ResponseNoContent,
  ApiReg006ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";
import { ApiReg007ResponseNoContent } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg007";
import { ApiReg008ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";
import { ApiReg013ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg013";
import type {
  ApiReg019RequestQuery,
  ApiReg019ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg019";
import type {
  ApiReg020RequestQuery,
  ApiReg020ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg020";
import { ApiReg026ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg026";
import { ApiReg028ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg028";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import {
  getKSTDate,
  takeOne,
  takeOnlyOne,
} from "@sparcs-clubs/api/common/util/util";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import DivisionPublicService from "@sparcs-clubs/api/feature/division/service/division.public.service";
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
    private readonly divisionPublicService: DivisionPublicService,
    private readonly userPublicService: UserPublicService,
  ) {}

  async postMemberRegistration(
    studentId: number,
    clubId: number,
  ): Promise<ApiReg005ResponseCreated> {
    // 현재 회원등록 신청 기간인지 확인하기
    //todo: 기간 확인 로직 구현 필요.
    const cur = getKSTDate();
    // await this.validateMemberRegistrationDate();

    // 해당 학생이 신청 자격이 존재하는지 확인하기
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
    await this.memberRegistrationRepository.create({
      student: { id: studentId },
      club: { id: clubId },
      semester: { id: semesterId },
    });
    return {};
  }

  async getMemberRegistrationsMy(
    studentId: number,
  ): Promise<ApiReg006ResponseType> {
    // const ismemberRegistrationEvent =
    //   await this.memberRegistrationRepository.isMemberRegistrationEvent();
    // if (!ismemberRegistrationEvent)
    //   return { status: HttpStatus.NO_CONTENT, data: { applies: [] } };
    const cur = getKSTDate();
    const semesterId = await this.clubPublicService.dateToSemesterId(cur);
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

    await this.memberRegistrationRepository.delete(applyId);
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
    await this.memberRegistrationRepository.patch(applyId, newbie =>
      newbie.set({
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
    const cur = getKSTDate();
    const semesterId = await this.clubPublicService.dateToSemesterId(cur);
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
    const semesterId =
      await this.clubPublicService.dateToSemesterId(getKSTDate());
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
    const semesterId =
      await this.clubPublicService.dateToSemesterId(getKSTDate());
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
    const semesterId =
      await this.clubPublicService.dateToSemesterId(getKSTDate());
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
    const today = getKSTDate();
    const semester = await this.clubPublicService.fetchSemester();
    const deadline = await this.memberRegistrationRepository
      .selectMemberRegistrationDeadline({
        semesterId: semester.id,
      })
      .then(takeOnlyOne("MemberRegistrationDeadline"));
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
              endDate: deadline.endTerm,
            }
          : null,
    };
  }
}

//지금 시점 기준으로 registration의 deadline을 넘지 않았는지 확인하는 함수.
// async isMemberRegistrationEvent(): Promise<boolean> {
//   const cur = getKSTDate();
//   const memberRegistrationEventEnum =
//     RegistrationDeadlineEnum.StudentRegistrationApplication;
//   const { isAvailable } = await this.db
//     .select({ isAvailable: count(RegistrationDeadlineD.id) })
//     .from(RegistrationDeadlineD)
//     .where(
//       and(
//         isNotNull(RegistrationDeadlineD.endDate),
//         gt(RegistrationDeadlineD.endDate, cur),
//         lt(RegistrationDeadlineD.startDate, cur),
//         eq(
//           RegistrationDeadlineD.registrationDeadlineEnumId,
//           memberRegistrationEventEnum,
//         ),
//       ),
//     )
//     .then(takeUnique);
//   if (isAvailable === 1) {
//     return true;
//   }
//   return false;
// }
