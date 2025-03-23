import { Injectable } from "@nestjs/common";
import { and, eq, InferSelectModel, isNull } from "drizzle-orm";

import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { BaseRepository } from "@sparcs-clubs/api/common/repository/base.repository";
import {
  RegistrationApplicationStudent,
  RegistrationDeadlineD,
} from "@sparcs-clubs/api/drizzle/schema/registration.schema";
import {
  MemberRegistrationQuery,
  MMemberRegistration,
} from "@sparcs-clubs/api/feature/registration/member-registration/model/member.registration.model";

type MemberRegistrationDbResult = InferSelectModel<
  typeof RegistrationApplicationStudent
>;

@Injectable()
export class MemberRegistrationRepository extends BaseRepository<
  MMemberRegistration,
  MemberRegistrationDbResult,
  typeof RegistrationApplicationStudent,
  MemberRegistrationQuery
> {
  constructor() {
    super(RegistrationApplicationStudent, MMemberRegistration);
  }

  // 별도 레포지토리로 분리해야 함
  async selectMemberRegistrationDeadline(param: { semesterId: number }) {
    const result = await this.db
      .select()
      .from(RegistrationDeadlineD)
      .where(
        and(
          eq(RegistrationDeadlineD.semesterId, param.semesterId),
          eq(
            RegistrationDeadlineD.registrationDeadlineEnumId,
            RegistrationDeadlineEnum.StudentRegistrationApplication,
          ),
          isNull(RegistrationDeadlineD.deletedAt),
        ),
      );
    return result;
  }
}
