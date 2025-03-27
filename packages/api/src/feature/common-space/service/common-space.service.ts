import { Injectable } from "@nestjs/common";

import type { ApiCms001ResponseOK } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms001";
import type { ApiCms002ResponseOK } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms002";
import type { ApiCms003ResponseCreated } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms003";
import type { ApiCms004ResponseOK } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms004";
import type { ApiCms005ResponseCreated } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms005";
import type { ApiCms006ResponseOk } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms006";
import type { ApiCms007ResponseOk } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms007";

import { BadRequestException } from "@sparcs-clubs/api/common/exception/bad-request.exception";
import { ForbiddenException } from "@sparcs-clubs/api/common/exception/forbidden.exception";
import { InvalidStateException } from "@sparcs-clubs/api/common/exception/invalid-state.exception";
import { NotFoundException } from "@sparcs-clubs/api/common/exception/not-found.exception";
import { getKSTDate, isEmptyObject } from "@sparcs-clubs/api/common/util/util";
import ClubStudentTRepository from "@sparcs-clubs/api/feature/club/repository/club.club-student-t.repository";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { Reservation, TermList } from "../dto/common-space.dto";
import { CommonSpaceRepository } from "../repository/common-space.repository";
import { CommonSpaceUsageOrderDRepository } from "../repository/common-space-usage-order-d.repository";
import { GetCommonSpacesUsageOrderRepository } from "../repository/getCommonSpacesUsageOrder.repository";
import { GetCommonSpacesUsageOrderMyRepository } from "../repository/getCommonSpacesUsageOrderMy.repository";
import { GetCommonSpaceUsageOrderRepository } from "../repository/getCommonSpaceUsageOrder.repository";
import {
  canMakeReservation,
  getWeekRange,
  periodicScheduleMake,
} from "../util/common-space.util";

@Injectable()
export class CommonSpaceService {
  constructor(
    private readonly commonSpaceRepository: CommonSpaceRepository,
    private readonly getCommonSpaceUsageOrderRepository: GetCommonSpaceUsageOrderRepository,
    private readonly commonSpaceUsageOrderDRepository: CommonSpaceUsageOrderDRepository,
    private readonly clubStudentTRepository: ClubStudentTRepository,
    private readonly userPublicService: UserPublicService,
    private readonly getCommonSpacesUsageOrderRepository: GetCommonSpacesUsageOrderRepository,
    private readonly clubPublicService: ClubPublicService,
    private readonly getCommonSpacesUsageOrderMyRepository: GetCommonSpacesUsageOrderMyRepository,
  ) {}

  async getCommonSpaces(): Promise<ApiCms001ResponseOK> {
    const result = await this.commonSpaceRepository.getAllCommonSpaces();
    return { commonSpaces: result };
  }

  async getCommonSpaceUsageOrder(
    spaceId,
    startDate,
    endDate,
  ): Promise<ApiCms002ResponseOK> {
    // await this.commonSpaceRepository.findCommonSpaceById(spaceId);
    const result =
      await this.getCommonSpaceUsageOrderRepository.findBySpaceIdAndStartTermBetweenAndEndTermBetween(
        spaceId,
        startDate,
        endDate,
      );
    return result;
  }

  // spaceId로 공용공간 타입 검색& available hours 두개 가져오기
  // commonspaceuseageorder에서 현재 동아리가 현재 공간에 신청한 시간 가져오기
  // 같은날 신청한 내역이 있다면 day 같은 주에 신청한 내역이 있다면 week로 가능한지 확인
  // 연장에 대해서는 어떻게 적용해야하지?
  async postStudentCommonSpaceUsageOrder(
    spaceId: number,
    clubId: number,
    studentId: number,
    startTerm: Date,
    endTerm: Date,
  ): Promise<ApiCms003ResponseCreated> {
    const commonSpace =
      await this.commonSpaceRepository.findCommonSpaceById(spaceId);
    const isReserved = await this.getCommonSpaceUsageOrder(
      spaceId,
      startTerm,
      endTerm,
    );
    if (isReserved.usageOrders.length > 0) {
      throw new InvalidStateException(
        "Common space",
        "reserved",
        "make reservation",
        { spaceId, startTerm, endTerm },
      );
    }
    const student =
      await this.clubStudentTRepository.findClubStudentByClubIdAndStudentId(
        clubId,
        studentId,
      );
    if (isEmptyObject(student)) {
      throw new NotFoundException("Student", studentId.toString(), {
        clubId,
        context: "club membership",
      });
    }

    const startDateforPrevSearch = getWeekRange(startTerm).weekStart;
    const endDateforPrevSearch = getWeekRange(endTerm).weekEnd;
    const prevReservation: Reservation[] =
      await this.commonSpaceUsageOrderDRepository.findBySpaceIdAndClubIdAndStartTermBetweenAndEndTermBetween(
        spaceId,
        clubId,
        startDateforPrevSearch,
        endDateforPrevSearch,
      );
    const isAvailable = canMakeReservation(
      startTerm,
      endTerm,
      prevReservation,
      commonSpace.availableHoursPerDay * 60,
      commonSpace.availableHoursPerWeek * 60,
    );
    if (isAvailable) {
      const result =
        await this.commonSpaceUsageOrderDRepository.setCommonSpaceUsageOrderD(
          spaceId,
          clubId,
          student.student_id,
          student.phoneNumber,
          startTerm,
          endTerm,
        );
      return result;
    }
    throw new BadRequestException("Time limit exceeded", "reservation", {
      spaceId,
      availableHoursPerDay: commonSpace.availableHoursPerDay,
      availableHoursPerWeek: commonSpace.availableHoursPerWeek,
    });
  }

  // todo: spaceid와 orderid 기존 예약 검색했을 때 존재해야함.
  // todo: studentId와 신ㅊ어 학새이 일치하지 않으면 error
  // todo: orderid로 검색했을때 startDate가 현재보다 미래여야 한다.
  // todo: 모두 만족하면 삭제 진행.
  async deleteStudentCommonSpaceUsageOrder(
    spaceId: number,
    orderId: number,
    studentId: number,
  ): Promise<ApiCms004ResponseOK> {
    const current = getKSTDate();
    const order =
      await this.commonSpaceUsageOrderDRepository.findCommonSpaceUsageOrderByIdAndSpaceId(
        orderId,
        spaceId,
      );
    if (order.chargeStudentId !== studentId) {
      throw new ForbiddenException("delete", "common space reservation", {
        orderId,
        requestedBy: studentId,
        ownedBy: order.chargeStudentId,
      });
    }
    if (order.startTerm < current) {
      throw new InvalidStateException("Reservation", "started", "delete", {
        orderId,
        startTerm: order.startTerm,
        currentTime: current,
      });
    }
    const result =
      await this.commonSpaceUsageOrderDRepository.deleteCommonSpaceUsageOrderD(
        orderId,
      );
    return result;
  }

  async postExecutiveCommonSpaecUsageOrder(
    spaceId: number,
    clubId: number,
    studentId: number,
    startTime: number,
    endTime: number,
  ): Promise<ApiCms005ResponseCreated> {
    const chargeStudent = await this.userPublicService.getStudentById({
      id: studentId,
    });
    const semester =
      await this.clubPublicService.findSemesterBetweenstartTermAndendTerm();
    const current = getKSTDate();
    const schedule: TermList[] = periodicScheduleMake(
      spaceId,
      clubId,
      studentId,
      chargeStudent.phoneNumber,
      startTime,
      endTime,
      current,
      semester.endTerm,
    );
    const result =
      await this.commonSpaceUsageOrderDRepository.setManyCommonSpaceUsageOrderD(
        schedule,
      );
    return result;
  }

  async getStudentCommonSpacesUsageOrder(
    studentId: number,
    clubId: number,
    startDate: Date,
    endDate: Date,
    pageOffset: number,
    itemCount: number,
  ): Promise<ApiCms006ResponseOk> {
    const student =
      await this.clubStudentTRepository.findClubStudentByClubIdAndStudentId(
        clubId,
        studentId,
      );
    if (isEmptyObject(student)) {
      throw new NotFoundException("Student", studentId.toString(), {
        clubId,
        context: "student",
      });
    }
    const result =
      await this.getCommonSpacesUsageOrderRepository.getStudentCommonSpacesUsageOrder(
        clubId,
        startDate,
        endDate,
        pageOffset - 1,
        itemCount,
      );
    return result;
  }

  async getStudentCommonSpacesUsageOrderMy(
    studentId: number,
    startDate: Date,
    endDate: Date,
    pageOffset: number,
    itemCount: number,
  ): Promise<ApiCms007ResponseOk> {
    const result =
      await this.getCommonSpacesUsageOrderMyRepository.getStudentCommonSpacesUsageOrderMy(
        studentId,
        startDate,
        endDate,
        pageOffset - 1,
        itemCount,
      );
    return result;
  }
}
