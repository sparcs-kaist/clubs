import { BadRequestException, Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { RegistrationStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import { BaseSingleTableRepository } from "@sparcs-clubs/api/common/base/base.single.repository";
import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";

import {
  ClubRegistrationApproval,
  IClubRegistrationApprovalCreate,
  MClubRegistrationApproval,
} from "../model/club-registration-approval.model";

@Injectable()
export class ClubRegistrationApprovalRepository extends BaseSingleTableRepository<
  MClubRegistrationApproval,
  IClubRegistrationApprovalCreate,
  {}
> {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super("registration", MClubRegistrationApproval);
  }

  async approve(
    applyId: number,
    reviewedAt: Date,
  ): Promise<MClubRegistrationApproval> {
    const delegate = this.getDelegate(this.txHost.tx);
    const result = await delegate.updateMany({
      where: {
        id: applyId,
        deletedAt: null,
        registrationApplicationStatusEnumId: {
          in: [RegistrationStatusEnum.Pending, RegistrationStatusEnum.Rejected],
        },
      },
      data: {
        registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
        reviewedAt,
      },
    });
    if (result.count !== 1) {
      throw new BadRequestException("Registration not found");
    }

    const registration = await delegate.findFirst({
      where: { id: applyId, deletedAt: null },
      select: {
        id: true,
        clubId: true,
        semesterId: true,
        studentId: true,
        registrationApplicationTypeEnumId: true,
        divisionId: true,
        activityFieldKr: true,
        activityFieldEn: true,
        professorId: true,
      },
    });
    return new MClubRegistrationApproval(registration);
  }

  protected dbToModelMapping(result: ClubRegistrationApproval) {
    return new MClubRegistrationApproval(result);
  }

  protected modelToDBMapping(model: MClubRegistrationApproval) {
    return { ...model };
  }

  protected createToDBMapping(model: IClubRegistrationApprovalCreate) {
    return { ...model };
  }

  protected fieldMap(field: "id") {
    return field;
  }
}
