import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import {
  ApiSem018RequestBody,
  ApiSem018ResponseCreated,
  ApiSem019ResponseOk,
  ApiSem020ResponseOk,
  ApiSem022RequestBody,
  ApiSem022ResponseOk,
} from "@clubs/interface/api/semester/index";

import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

import UserPublicService from "../../user/service/user.public.service";
import { MRegistrationDeadline } from "../model/registration.deadline.model";
import { MSemester } from "../model/semester.model";
import { RegistrationDeadlineRepository } from "../repository/registration.deadline.repository";
import { SemesterRepository } from "../repository/semester.repository";

@Injectable()
export class RegistrationDeadlineService {
  constructor(
    private readonly registrationDeadlineRepository: RegistrationDeadlineRepository,
    private readonly semesterRepository: SemesterRepository,
    private readonly userPublicService: UserPublicService,
  ) {}

  async createRegistrationDeadline(
    executiveId: number,
    body: ApiSem018RequestBody,
  ): Promise<ApiSem018ResponseCreated> {
    const { semesterId, deadlineEnum, startTerm, endTerm } = body;

    await this.userPublicService.checkCurrentExecutiveById(executiveId);

    const semester = await this.semesterRepository
      .find({ id: semesterId })
      .then(takeOnlyOne(MSemester));

    if (!semester) {
      throw new HttpException(
        `해당 학기를 찾을 수 없습니다.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (startTerm >= endTerm) {
      throw new HttpException(
        "시작날짜는 종료날짜보다 이전이어야 합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check for overlapping deadlines of the same type in the same semester
    const existing = await this.registrationDeadlineRepository.find({
      semesterId,
      deadlineEnum,
    });

    const hasOverlap = existing.some(
      d => startTerm < d.endTerm && endTerm > d.startTerm,
    );

    if (hasOverlap) {
      throw new HttpException(
        "중복되는 기한이 존재합니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.registrationDeadlineRepository.create({
      semester: { id: semesterId },
      deadlineEnum,
      startTerm,
      endTerm,
    });

    return {};
  }

  async getRegistrationDeadlines(
    executiveId: number,
    semesterId?: number,
  ): Promise<ApiSem019ResponseOk> {
    await this.userPublicService.checkCurrentExecutiveById(executiveId);

    const query: Record<string, unknown> = {};
    if (semesterId) {
      query.semesterId = semesterId;
    }

    const deadlines = await this.registrationDeadlineRepository.find(
      query as Parameters<typeof this.registrationDeadlineRepository.find>[0],
    );

    return {
      deadlines: deadlines.map(d => ({
        id: d.id,
        semesterId: d.semester.id,
        deadlineEnum: d.deadlineEnum,
        startTerm: d.startTerm,
        endTerm: d.endTerm,
      })),
    };
  }

  async deleteRegistrationDeadline(
    executiveId: number,
    deadlineId: number,
  ): Promise<ApiSem020ResponseOk> {
    await this.userPublicService.checkCurrentExecutiveById(executiveId);

    const existing = await this.registrationDeadlineRepository.find({
      id: deadlineId,
    } as Parameters<typeof this.registrationDeadlineRepository.find>[0]);

    if (existing.length === 0) {
      throw new HttpException(
        "해당 등록 기간을 찾을 수 없습니다.",
        HttpStatus.NOT_FOUND,
      );
    }

    await this.registrationDeadlineRepository.delete({
      id: deadlineId,
    } as Parameters<typeof this.registrationDeadlineRepository.delete>[0]);

    return {};
  }

  async updateRegistrationDeadline(
    executiveId: number,
    deadlineId: number,
    body: ApiSem022RequestBody,
  ): Promise<ApiSem022ResponseOk> {
    const { startTerm, endTerm } = body;

    await this.userPublicService.checkCurrentExecutiveById(executiveId);

    const registrationDeadlines =
      (await this.registrationDeadlineRepository.find({
        id: deadlineId,
      } as Parameters<typeof this.registrationDeadlineRepository.find>[0])) ??
      [];
    const [registrationDeadline] = registrationDeadlines;

    if (!registrationDeadline) {
      throw new HttpException(
        "해당 등록 기간을 찾을 수 없습니다.",
        HttpStatus.NOT_FOUND,
      );
    }

    if (startTerm > endTerm) {
      throw new HttpException(
        "시작날짜는 종료날짜보다 이후일 수 없습니다.",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.registrationDeadlineRepository.put(
      new MRegistrationDeadline({
        ...registrationDeadline,
        startTerm,
        endTerm,
      }),
    );

    return { id: deadlineId };
  }
}
