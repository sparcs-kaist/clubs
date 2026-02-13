import { Injectable } from "@nestjs/common";

import type { ApiAcf003RequestQuery } from "@clubs/interface/api/activity-certificate/endpoint/apiAcf003";
import type { ApiAcf007RequestQuery } from "@clubs/interface/api/activity-certificate/endpoint/apiAcf007";
import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ActivityCertificateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countActivityCertificatesByClubIdAndCreatedAtIn(
    clubId: number,
    startDate?: Date,
    endTerm?: Date,
  ): Promise<number> {
    const numberOfOrders = await this.prisma.activityCertificate.count({
      where: {
        clubId,
        ...(startDate !== undefined && { createdAt: { gte: startDate } }),
        ...(endTerm !== undefined && {
          createdAt: {
            ...(startDate !== undefined && { gte: startDate }),
            lte: endTerm,
          },
        }),
      },
    });

    return numberOfOrders;
  }

  async countActivityCertificatesByStudentIdAndCreatedAtIn(
    StudentId: number,
    startDate?: Date,
    endTerm?: Date,
  ): Promise<number> {
    const numberOfOrders = await this.prisma.activityCertificate.count({
      where: {
        studentId: StudentId,
        ...(startDate !== undefined && { createdAt: { gte: startDate } }),
        ...(endTerm !== undefined && {
          createdAt: {
            ...(startDate !== undefined && { gte: startDate }),
            lte: endTerm,
          },
        }),
      },
    });

    return numberOfOrders;
  }

  async findActivityCertificatesPageByClubIdAndCreatedAtIn(
    query: ApiAcf003RequestQuery,
  ) {
    const startIndex = (query.pageOffset - 1) * query.itemCount + 1;

    // Build where clause dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { clubId: query.clubId };
    if (query.startDate !== undefined) {
      where.createdAt = { ...(where.createdAt || {}), gte: query.startDate };
    }
    if (query.endTerm !== undefined) {
      where.createdAt = { ...(where.createdAt || {}), lte: query.endTerm };
    }

    const orders = await this.prisma.activityCertificate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.itemCount,
      skip: startIndex - 1,
    });

    return orders;
  }

  async paginateByStudentIdAndCreatedAtIn(
    studentId: number,
    query: ApiAcf007RequestQuery,
  ) {
    const offset = (query.pageOffset - 1) * query.itemCount;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { studentId };
    if (query.startDate !== undefined) {
      where.createdAt = { ...(where.createdAt || {}), gte: query.startDate };
    }
    if (query.endTerm !== undefined) {
      where.createdAt = { ...(where.createdAt || {}), lte: query.endTerm };
    }

    const orders = await this.prisma.activityCertificate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.itemCount,
      skip: offset,
    });

    return orders;
  }

  async postActivityCertificate({
    clubId,
    studentId,
    studentPhoneNumber,
    issuedNumber,
    items,
  }: {
    clubId: number;
    studentId: number;
    studentPhoneNumber: string;
    issuedNumber: number;
    items: { startMonth: Date; endMonth: Date; detail: string }[];
  }) {
    // TODO: transaction 실패했을 때 에러핸들링
    await this.prisma.$transaction(async tx => {
      const certificate = await tx.activityCertificate.create({
        data: {
          clubId,
          studentId,
          studentPhoneNumber,
          issueNumber: issuedNumber,
          activityCertificateStatusEnum:
            ActivityCertificateOrderStatusEnum.Applied,
        },
      });

      await Promise.all(
        items.map((item, index) =>
          tx.activityCertificateItem.create({
            data: {
              activityCertificateId: certificate.id,
              order: index,
              startMonth: item.startMonth,
              endMonth: item.endMonth,
              detail: item.detail,
            },
          }),
        ),
      );
    });
  }
}
