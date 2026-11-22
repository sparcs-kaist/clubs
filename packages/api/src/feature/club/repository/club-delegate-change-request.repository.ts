import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/domain/club/club-delegate-change-request";

import { BaseTableFieldMapKeys } from "@sparcs-clubs/api/common/base/base.repository";
import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

import {
  IClubDelegateChangeRequestCreate,
  MClubDelegateChangeRequest,
} from "../model/club-delegate-change-request.model";
import { cancelPendingDelegateRequests } from "./lock-club-delegates";

type ClubDelegateChangeRequestQuery = {
  clubId: number;
  clubDelegateChangeRequestStatusEnum: ClubDelegateChangeRequestStatusEnum;
};

type ClubDelegateChangeRequestOrderByKeys = "id";
type ClubDelegateChangeRequestFieldMapKeys = BaseTableFieldMapKeys<
  ClubDelegateChangeRequestQuery,
  ClubDelegateChangeRequestOrderByKeys
>;

@Injectable()
export class ClubDelegateChangeRequestRepository extends BaseSingleTableRepository<
  MClubDelegateChangeRequest,
  IClubDelegateChangeRequestCreate,
  ClubDelegateChangeRequestQuery,
  ClubDelegateChangeRequestOrderByKeys
> {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super("clubDelegateChangeRequest", MClubDelegateChangeRequest);
  }

  async cancelAppliedRequests(clubId: number, now: Date): Promise<void> {
    await cancelPendingDelegateRequests(this.txHost, clubId, now);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected dbToModelMapping(result: any): MClubDelegateChangeRequest {
    return new MClubDelegateChangeRequest({
      id: result.id,
      club: { id: result.clubId },
      prevStudent: { id: result.prevStudentId },
      student: { id: result.studentId },
      clubDelegateEnumId: result.clubDelegateEnumId,
      clubDelegateChangeRequestStatusEnum:
        result.clubDelegateChangeRequestStatusEnumId,
      deletedAt: result.deletedAt,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected modelToDBMapping(model: MClubDelegateChangeRequest): any {
    return {
      id: model.id,
      clubId: model.club.id,
      prevStudentId: model.prevStudent.id,
      studentId: model.student.id,
      clubDelegateEnumId: model.clubDelegateEnumId,
      clubDelegateChangeRequestStatusEnumId:
        model.clubDelegateChangeRequestStatusEnum,
      deletedAt: model.deletedAt,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected createToDBMapping(model: IClubDelegateChangeRequestCreate): any {
    return {
      clubId: model.club.id,
      prevStudentId: model.prevStudent.id,
      studentId: model.student.id,
      clubDelegateEnumId: model.clubDelegateEnumId,
      clubDelegateChangeRequestStatusEnumId:
        model.clubDelegateChangeRequestStatusEnum,
    };
  }

  protected fieldMap(
    field: ClubDelegateChangeRequestFieldMapKeys,
  ): string | null | undefined {
    const fieldMappings: Record<ClubDelegateChangeRequestFieldMapKeys, string> =
      {
        id: "id",
        clubId: "clubId",
        clubDelegateChangeRequestStatusEnum:
          "clubDelegateChangeRequestStatusEnumId",
      };

    return fieldMappings[field];
  }
}
