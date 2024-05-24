import { ClubStudentTRepository } from "@sparcs-clubs/api/common/repository/club-student-t.repository";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ApiCms001ResponseOK } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms001";
import { ApiCms002ResponseOK } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms002";
import { ApiCms003ResponseCreated } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms003";
import { getKSTDate, isEmptyObject } from "@sparcs-clubs/api/common/util/util";
import { ApiCms004ResponseOK } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms004";
import { StudentRepository } from "@sparcs-clubs/api/common/repository/student.repository";
import { SemesterRepository } from "@sparcs-clubs/api/common/repository/semester.repository";
import { ApiCms005ResponseCreated } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms005";
import { ApiCms006ResponseOk } from "@sparcs-clubs/interface/api/common-space/endpoint/apiCms006";
import { GetCommonSpaceUsageOrderRepository } from "../repository/getCommonSpaceUsageOrder.repository";
import { CommonSpaceRepository } from "../repository/common-space.repository";
import { CommonSpaceUsageOrderDRepository } from "../repository/common-space-usage-order-d.repository";
import { Reservation, TermList } from "../dto/common-space.dto";
import {
  canMakeReservation,
  periodicScheduleMake,
} from "./calculate-time.util";
import { GetCommonSpacesUsageOrderRepository } from "../repository/getCommonSpacesUsageOrder.repository";

@Injectable()
export class CommonSpaceService {
  constructor(
    private readonly commonSpaceRepository: CommonSpaceRepository,
    private readonly getCommonSpaceUsageOrderRepository: GetCommonSpaceUsageOrderRepository,
    private readonly commonSpaceUsageOrderDRepository: CommonSpaceUsageOrderDRepository,
    private readonly clubStudentTRepository: ClubStudentTRepository,
    private readonly studentRepository: StudentRepository,
    private readonly getCommonSpacesUsageOrderRepository: GetCommonSpacesUsageOrderRepository,
    private readonly semesterRepository: SemesterRepository,
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
      throw new HttpException(
        "Already used by other order.",
        HttpStatus.BAD_REQUEST,
      );
    }
    const student =
      await this.clubStudentTRepository.findClubStudentByClubIdAndStudentId(
        clubId,
        studentId,
      );
    if (isEmptyObject(student)) {
      throw new HttpException(
        "Student is not in the club.",
        HttpStatus.NOT_FOUND,
      );
    }

    const prevReservation: Reservation[] =
      await this.commonSpaceUsageOrderDRepository.findBySpaceIdAndClubIdAndStartTermBetweenAndEndTermBetween(
        spaceId,
        clubId,
        startTerm,
        endTerm,
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
    throw new HttpException("Available time exceeded", HttpStatus.BAD_REQUEST);
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
      throw new HttpException(
        "You are not allowed to delete this order",
        HttpStatus.FORBIDDEN,
      );
    }
    if (order.startTerm < current) {
      throw new HttpException(
        "Reservation can only be deleted before the start time",
        HttpStatus.BAD_REQUEST,
      );
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
    const chargeStudent =
      await this.studentRepository.findStudentById(studentId);
    const semester =
      await this.semesterRepository.findSemesterBetweenstartTermAndendTerm();
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
      throw new HttpException(
        "Student is not in the club.",
        HttpStatus.NOT_FOUND,
      );
    }
    const result =
      await this.getCommonSpacesUsageOrderRepository.getStudentCommonSpacesUsageOrder(
        clubId,
        startDate,
        endDate,
        pageOffset,
        itemCount,
      );
    return result;
  }
}
