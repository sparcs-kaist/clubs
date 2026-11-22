import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";
import type { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { Prisma } from "@prisma/client";

import type {
  ApiClb006RequestParam,
  ApiClb006ResponseOK,
} from "@clubs/interface/api/club/endpoint/apiClb006";
import type {
  ApiClb008RequestParam,
  ApiClb008ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb008";
import type { ApiClb012RequestParam } from "@clubs/interface/api/club/endpoint/apiClb012";
import type { ApiClb013ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb013";
import type {
  ApiClb014RequestBody,
  ApiClb014RequestParam,
} from "@clubs/interface/api/club/endpoint/apiClb014";
import type {
  ApiClb015ResponseNoContent,
  ApiClb015ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb015";
import type {
  ApiClb011RequestParam,
  ApiClb011ResponseOk,
} from "@clubs/interface/api/club/index";
import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import logger from "@sparcs-clubs/api/common/util/logger";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import { SemesterPublicService } from "@sparcs-clubs/api/feature/semester/publicService/semester.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { ClubDelegateDRepository } from "./club.club-delegate-d.repository";

const readCommitted = {
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

interface ApiClb015ResponseType {
  status: number;
  data: ApiClb015ResponseOk | ApiClb015ResponseNoContent;
}
@Injectable()
export default class ClubDelegateService {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(
    private clubDelegateDRepository: ClubDelegateDRepository,
    private userPublicService: UserPublicService,
    private clubPublicService: ClubPublicService,
    private semesterPublicService: SemesterPublicService,
  ) {}

  async getStudentClubDelegates(
    param: { studentId: number } & ApiClb006RequestParam,
  ): Promise<ApiClb006ResponseOK> {
    // clubId 동아리의 현재 대표자와 대의원 목록을 가져옵니다.
    const delegates = await this.clubDelegateDRepository.findDelegateByClubId(
      param.clubId,
    );

    // studentId가 해당 clubId 동아리의 대표자 또는 대의원인지 확인합니다.
    if (delegates.find(e => e.studentId === param.studentId) === undefined)
      throw new HttpException(
        "The api is allowed for delegates",
        HttpStatus.FORBIDDEN,
      );

    const students = await this.userPublicService.findStudentContacts(
      delegates.map(delegate => delegate.studentId),
    );
    const studentById = new Map(students.map(student => [student.id, student]));
    const delegateInfos = delegates.map(delegate => {
      const student = studentById.get(delegate.studentId);
      if (!student)
        throw new NotFoundException("직책자의 학생 정보를 찾을 수 없습니다.");

      return {
        name: student.name,
        studentId: student.id,
        delegateEnumId: delegate.clubDelegateEnum as ClubDelegateEnum,
        studentNumber: student.number,
        phoneNumber: student.user?.phoneNumber ?? null,
      };
    });

    return { delegates: delegateInfos };
  }

  private currentTermFor(
    terms: Awaited<ReturnType<ClubDelegateDRepository["findDelegateByClubId"]>>,
    role: ClubDelegateEnum,
  ) {
    const matching = terms.filter(term => term.clubDelegateEnum === role);
    if (matching.length > 1) {
      throw new ConflictException("동아리 직책 임기 정보가 중복되어 있습니다.");
    }
    return matching[0];
  }

  private requireRepresentative(
    terms: Awaited<ReturnType<ClubDelegateDRepository["findDelegateByClubId"]>>,
    studentId: number,
  ) {
    const representative = this.currentTermFor(
      terms,
      ClubDelegateEnum.Representative,
    );
    if (representative?.studentId !== studentId) {
      throw new ForbiddenException(
        "동아리 대표자만 직책 변경을 요청할 수 있습니다.",
      );
    }
  }

  private async validateCandidate(
    studentId: number,
    clubId: number,
    role: ClubDelegateEnum,
    now: Date,
  ) {
    const semesterId = await this.semesterPublicService.loadId();
    const membership =
      await this.clubDelegateDRepository.findCandidateMembership(
        studentId,
        clubId,
        semesterId,
      );
    const [student] = await this.userPublicService.findStudentContacts([
      studentId,
    ]);
    const userId = membership ? student?.user?.id : undefined;
    if (userId === undefined) {
      throw new ConflictException(
        "현재 동아리에서 직책을 맡을 수 없는 학생입니다.",
      );
    }

    const terms = await this.clubDelegateDRepository.findDelegateByStudentId(
      studentId,
      now,
    );
    if (terms.length > 1) {
      throw new ConflictException(
        "대상자의 직책 임기 정보가 중복되어 있습니다.",
      );
    }
    const term = terms[0];
    if (!term) return { userId, semesterId, previousRole: undefined };
    if (term.clubId !== clubId) {
      throw new ConflictException(
        "대상자가 다른 동아리에서 직책을 맡고 있습니다.",
      );
    }
    if (role !== ClubDelegateEnum.Representative) {
      throw new ConflictException("대상자가 이미 동아리 직책을 맡고 있습니다.");
    }
    return {
      userId,
      semesterId,
      previousRole: term.clubDelegateEnum as ClubDelegateEnum,
    };
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async putStudentClubDelegate(param: {
    studentId: number;
    targetStudentId: number;
    clubId: number;
    clubDelegateEnumId: ClubDelegateEnum;
  }): Promise<void> {
    const { studentId, targetStudentId, clubId, clubDelegateEnumId } = param;
    const repo = this.clubDelegateDRepository;
    await repo.lockChanges(
      clubId,
      targetStudentId === 0 ? undefined : targetStudentId,
    );
    const now = this.clock.now();
    const terms = await repo.findDelegateByClubId(clubId, now);
    this.requireRepresentative(terms, studentId);
    this.currentTermFor(terms, clubDelegateEnumId);

    if (targetStudentId === 0) {
      if (clubDelegateEnumId === ClubDelegateEnum.Representative) {
        throw new BadRequestException("대표자 직책을 해제할 수 없습니다.");
      }
      await repo.cancelPendingRequests({ clubId, clubDelegateEnumId }, now);
      await repo.updateDelegate({
        clubId,
        clubDelegateEnumId,
        studentId: 0,
        now,
      });
      return;
    }

    if (targetStudentId === studentId) {
      throw new BadRequestException("본인에게 변경을 요청할 수 없습니다.");
    }
    await this.validateCandidate(
      targetStudentId,
      clubId,
      clubDelegateEnumId,
      now,
    );
    const conflict = await repo.findConflictingRequest(
      clubId,
      clubDelegateEnumId,
      targetStudentId,
      now,
    );
    if (conflict) {
      throw new ConflictException(
        "해당 직책 또는 대상자에게 대기 중인 요청이 있습니다.",
      );
    }
    await repo.createRequest({
      clubId,
      clubDelegateEnumId,
      prevStudentId: studentId,
      studentId: targetStudentId,
      createdAt: now,
    });
  }

  async getStudentClubDelegateRequests(param: {
    param: ApiClb011RequestParam;
    studentId: number;
  }): Promise<ApiClb011ResponseOk> {
    const { clubId } = param.param;
    const now = this.clock.now();
    const delegates = await this.clubDelegateDRepository.findDelegateByClubId(
      clubId,
      now,
    );
    if (!delegates.some(e => e.studentId === param.studentId)) {
      throw new ForbiddenException(
        "동아리 임원만 변경 요청을 조회할 수 있습니다.",
      );
    }

    const result = await this.clubDelegateDRepository.findClubRequests(
      clubId,
      now,
    );
    const students = await this.userPublicService.findStudentContacts(
      result.map(request => request.studentId),
    );
    const studentById = new Map(students.map(student => [student.id, student]));
    return {
      requests: result.flatMap(request => {
        const student = studentById.get(request.studentId);
        if (!student) return [];
        return [
          {
            id: request.id,
            delegateEnumId: request.clubDelegateEnumId as ClubDelegateEnum,
            studentId: request.studentId,
            studentNumber: student.number,
            studentName: student.name,
            clubDelegateChangeRequestStatusEnumId:
              request.clubDelegateChangeRequestStatusEnumId as ClubDelegateChangeRequestStatusEnum,
          },
        ];
      }),
    };
  }

  async getStudentClubsDelegatesRequests(param: {
    studentId: number;
  }): Promise<ApiClb013ResponseOk> {
    const result = await this.clubDelegateDRepository.findReceivedRequests(
      param.studentId,
      this.clock.now(),
    );
    const students = await this.userPublicService.findStudentContacts(
      result.map(request => request.prevStudentId),
    );
    const studentById = new Map(students.map(student => [student.id, student]));
    return {
      requests: result.flatMap(request => {
        const requester = studentById.get(request.prevStudentId);
        if (!requester) return [];
        return [
          {
            id: request.id,
            clubId: request.clubId,
            clubName: request.club.nameKr,
            delegateEnumId: request.clubDelegateEnumId as ClubDelegateEnum,
            prevStudentId: request.prevStudentId,
            prevStudentName: requester.name,
            prevStudentNumber: requester.number,
            clubDelegateChangeRequestStatusEnumId:
              request.clubDelegateChangeRequestStatusEnumId as ClubDelegateChangeRequestStatusEnum,
          },
        ];
      }),
    };
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async deleteStudentClubDelegateRequests(param: {
    param: ApiClb012RequestParam;
    requestId?: number;
    studentId: number;
  }): Promise<void> {
    const { clubId } = param.param;
    const repo = this.clubDelegateDRepository;
    await repo.lockChanges(clubId);
    const now = this.clock.now();
    const terms = await repo.findDelegateByClubId(clubId, now);
    this.requireRepresentative(terms, param.studentId);

    if (param.requestId === undefined) {
      await repo.cancelPendingRequests(
        { clubId, clubDelegateEnumId: ClubDelegateEnum.Representative },
        now,
      );
      return;
    }
    const result = await repo.cancelPendingRequests(
      { clubId, id: param.requestId },
      now,
    );
    if (result.count !== 1) {
      throw new ConflictException("이미 처리되었거나 만료된 요청입니다.");
    }
  }

  @Transactional<TransactionalAdapterPrisma>(readCommitted)
  async patchStudentClubsDelegatesRequest(param: {
    studentId: number;
    userId: number;
    param: ApiClb014RequestParam;
    body: ApiClb014RequestBody;
  }): Promise<void> {
    const repo = this.clubDelegateDRepository;
    const request = await repo.findRequestById(param.param.requestId);
    if (!request)
      throw new NotFoundException("직책 변경 요청을 찾을 수 없습니다.");
    if (request.studentId !== param.studentId) {
      throw new ForbiddenException("요청을 받은 학생만 응답할 수 있습니다.");
    }

    await repo.lockChanges(request.clubId, param.studentId);
    const now = this.clock.now();
    const status = param.body.clubDelegateChangeRequestStatusEnum;
    const transition = await repo.finishRequest(request.id, status, now);
    if (transition.count !== 1) {
      throw new ConflictException("이미 처리되었거나 만료된 요청입니다.");
    }
    if (status === ClubDelegateChangeRequestStatusEnum.Rejected) return;

    const role = request.clubDelegateEnumId as ClubDelegateEnum;
    const terms = await repo.findDelegateByClubId(request.clubId, now);
    const current = this.currentTermFor(terms, role);

    if (role === ClubDelegateEnum.Representative) {
      if (current?.studentId !== request.prevStudentId) {
        throw new ConflictException(
          "요청 이후 동아리 대표자가 변경되었습니다.",
        );
      }
    }

    const candidate = await this.validateCandidate(
      param.studentId,
      request.clubId,
      role,
      now,
    );
    if (candidate.userId !== param.userId) {
      throw new ForbiddenException("요청을 받은 계정으로 수락해 주세요.");
    }

    await this.userPublicService.updatePhoneNumber(
      param.userId,
      param.body.phoneNumber,
    );
    await repo.updateDelegate({
      clubId: request.clubId,
      clubDelegateEnumId: role,
      studentId: param.studentId,
      now,
      semesterId: candidate.semesterId,
    });
    if (candidate.previousRole !== undefined) {
      await repo.cancelPendingRequests(
        { clubId: request.clubId, clubDelegateEnumId: candidate.previousRole },
        now,
      );
    }
  }

  /**
   * @param studentId 신청자 학생 Id
   *
   * @description 동아리 대표자의 변경을 적용합니다.
   */
  // 내가 대표자 또는 대의원으로 있는 동아리의 clubId를 가져옵니다. 대표자 또는 대의원이 아닐 경우 204 No Content를 반환합니다.
  async getStudentClubDelegate(
    studentId: number,
  ): Promise<ApiClb015ResponseType> {
    const result =
      await this.clubDelegateDRepository.findDelegateByStudentId(studentId);

    if (result.length === 0)
      return {
        status: HttpStatus.NOT_FOUND,
        data: {},
      };
    if (result.length > 1)
      throw new HttpException("unreachable", HttpStatus.INTERNAL_SERVER_ERROR);
    return {
      status: HttpStatus.OK,
      data: {
        clubId: result[0].clubId,
        delegateEnumId: result[0].clubDelegateEnum,
      },
    };
  }

  /**
   * @param studentId 학생 Id
   * @param param
   * @description getStudentClubDelegateCandidates 의 서비스 진입점입니다.
   */
  async getStudentClubDelegateCandidates(param: {
    studentId: number;
    param: ApiClb008RequestParam;
  }): Promise<ApiClb008ResponseOk> {
    // 동아리 대표자 또는 대의원이 맞는지 확인합니다.
    if (param.param.delegateEnumId === ClubDelegateEnum.Representative) {
      const isPresident = await this.clubPublicService.isStudentPresident(
        param.studentId,
        param.param.clubId,
      );
      if (!isPresident)
        throw new HttpException(
          "It seems that you are not a representative of the club",
          HttpStatus.UNAUTHORIZED,
        );
    } else {
      const isDelegate = await this.clubPublicService.isStudentDelegate(
        param.studentId,
        param.param.clubId,
      );
      if (!isDelegate)
        throw new HttpException(
          "It seems that you are not a delegate of the club",
          HttpStatus.UNAUTHORIZED,
        );
    }

    const semesterId = await this.semesterPublicService.loadId();
    logger.debug(semesterId);
    const candidateIds =
      await this.clubDelegateDRepository.selectDelegateCandidateIds({
        clubId: param.param.clubId,
        semesterId,
        filterClubDelegateEnum:
          param.param.delegateEnumId === ClubDelegateEnum.Representative
            ? [ClubDelegateEnum.Representative]
            : Object.values(ClubDelegateEnum),
      });
    const students =
      await this.userPublicService.findStudentContacts(candidateIds);
    return {
      students: students.flatMap(student => {
        if (!student.user) return [];
        return [
          {
            id: student.id,
            studentNumber: String(student.number),
            name: student.name,
            phoneNumber: student.user.phoneNumber,
          },
        ];
      }),
    };
  }
}
