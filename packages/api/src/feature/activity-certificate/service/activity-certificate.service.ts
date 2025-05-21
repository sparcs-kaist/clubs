import { Injectable } from "@nestjs/common";

import type { ApiAcf001RequestBody } from "@clubs/interface/api/activity-certificate/endpoint/apiAcf001";
import type {
  ApiAcf003RequestQuery,
  ApiAcf003ResponseOk,
} from "@clubs/interface/api/activity-certificate/endpoint/apiAcf003";
import type {
  ApiAcf007RequestQuery,
  ApiAcf007ResponseOk,
} from "@clubs/interface/api/activity-certificate/endpoint/apiAcf007";

import { ForbiddenException } from "@sparcs-clubs/api/common/exception/forbidden.exception";
import { ClubDelegateDRepository } from "@sparcs-clubs/api/feature/club/delegate/club.club-delegate-d.repository";
import ClubPublicService from "@sparcs-clubs/api/feature/club/service/club.public.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { ActivityCertificateRepository } from "../repository/activity-certificate.repository";

@Injectable()
export class ActivityCertificateService {
  constructor(
    private readonly activityCertificateRepository: ActivityCertificateRepository,
    private readonly clubPublicService: ClubPublicService,
    private readonly clubDelegateDRepository: ClubDelegateDRepository,
    private readonly userPublicService: UserPublicService,
  ) {}

  async postActivityCertificate(body: ApiAcf001RequestBody) {
    await this.activityCertificateRepository.postActivityCertificate({
      clubId: body.clubId,
      studentId: 605, // TODO: 실제 studentId 적용
      studentPhoneNumber: body.studentPhoneNumber,
      issuedNumber: body.issuedNumber,
      items: body.items, // TODO: item validation
    });
  }

  async getStudentActivityCertificatesClubHistory(param: {
    studentId: number;
  }) {
    const clubHistory =
      await this.clubPublicService.getClubBelongDurationOfStudent(param); // TODO: 실제 studentId 적용
    return clubHistory;
  }

  async getStudentActivityCertificates(
    query: ApiAcf003RequestQuery,
  ): Promise<ApiAcf003ResponseOk> {
    const tempStudentId = 605; // 하승종 id를 임시로 씁시다

    // 조회하는 club의 현재학기 대표가 student가 맞는지 검사합니다.
    const representatives =
      await this.clubDelegateDRepository.findRepresentativeIdListByClubId(
        query.clubId,
      );
    if (
      representatives.find(e => e.studentId === tempStudentId) === undefined
    ) {
      throw new ForbiddenException("access", "activity certificate");
    }

    const total =
      await this.activityCertificateRepository.countActivityCertificatesByClubIdAndCreatedAtIn(
        query.clubId,
        query.startDate,
        query.endTerm,
      );

    const items = await Promise.all(
      (
        await this.activityCertificateRepository.findActivityCertificatesPageByClubIdAndCreatedAtIn(
          query,
        )
      ).map(async row => ({
        orderId: row.id,
        studentName: (
          await this.userPublicService.getStudentById({ id: row.studentId })
        ).name,
        issuedNumber: row.issueNumber,
        statusEnum: row.activityCertificateStatusEnum,
        createdAt: row.createdAt,
      })),
    );

    return {
      total,
      items,
      offset: query.pageOffset,
    };
  }

  async getStudentActivityCertificatesMy(
    query: ApiAcf007RequestQuery,
  ): Promise<ApiAcf007ResponseOk> {
    const tempStudentId = 605; // 하승종 id를 임시로 씁시다

    const total =
      await this.activityCertificateRepository.countActivityCertificatesByStudentIdAndCreatedAtIn(
        tempStudentId,
        query.startDate,
        query.endTerm,
      );

    const items = await Promise.all(
      (
        await this.activityCertificateRepository.paginateByStudentIdAndCreatedAtIn(
          tempStudentId,
          query,
        )
      ).map(async row => ({
        orderId: row.id,
        studentName: (
          await this.userPublicService.getStudentById({ id: row.studentId })
        ).name,
        issuedNumber: row.issueNumber,
        statusEnum: row.activityCertificateStatusEnum,
        createdAt: row.createdAt,
      })),
    );

    return {
      total,
      items,
      offset: query.pageOffset,
    };
  }
}
