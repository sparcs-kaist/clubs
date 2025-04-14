import { Injectable } from "@nestjs/common";

import type {
  ApiSem001RequestQuery,
  ApiSem001ResponseOK,
} from "@clubs/interface/api/semester/apiSem001";
import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";
import { FundingDeadlineEnum } from "@clubs/interface/common/enum/funding.enum";
import { RegistrationDeadlineEnum } from "@clubs/interface/common/enum/registration.enum";

import { OrderByTypeEnum } from "@sparcs-clubs/api/common/enums";
import { takeOnlyOne } from "@sparcs-clubs/api/common/util/util";

import { MSemester } from "../model/semester.model";
import { ActivityDeadlinePublicService } from "../publicService/activity.deadline.public.service";
import { ActivityDurationPublicService } from "../publicService/activity.duration.public.service";
import { FundingDeadlinePublicService } from "../publicService/funding.deadline.public.service";
import { RegistrationDeadlinePublicService } from "../publicService/registration.deadline.public.service";
import { SemesterPublicService } from "../publicService/semester.public.service";
import { SemesterRepository } from "../repository/semester.repository";

@Injectable()
export class SemesterService {
  constructor(
    private readonly semesterRepository: SemesterRepository,
    private readonly semesterPublicService: SemesterPublicService,
    private readonly activityDurationPublicService: ActivityDurationPublicService,
    private readonly activityDeadlinePublicService: ActivityDeadlinePublicService,
    private readonly fundingDeadlinePublicService: FundingDeadlinePublicService,
    private readonly registrationDeadlinePublicService: RegistrationDeadlinePublicService,
  ) {}

  /**
   * @description getPublicSemesters의 서비스 진입점입니다.
   * @param query
   * @returns
   */
  async getPublicSemesters(param: {
    query: ApiSem001RequestQuery;
  }): Promise<ApiSem001ResponseOK> {
    const { pageOffset, itemCount } = param.query;
    const semesters = await this.semesterRepository
      .find({
        date: new Date(),
        pagination: {
          offset: pageOffset,
          itemCount,
        },
        orderBy: {
          endTerm: OrderByTypeEnum.DESC,
        },
      })
      .then(takeOnlyOne(MSemester));

    const total = await this.semesterRepository.find({});
    const totalCount = total.length;

    console.log(await this.activityDurationPublicService.load());
    console.log(
      await this.activityDeadlinePublicService.load({
        date: new Date(),
        deadlineEnum: ActivityDeadlineEnum.Writing,
      }),
    );
    console.log(
      await this.fundingDeadlinePublicService.load({
        date: new Date(),
        deadlineEnum: FundingDeadlineEnum.Writing,
      }),
    );
    console.log(
      await this.registrationDeadlinePublicService.load({
        date: new Date(),
        deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
      }),
    );

    return {
      semesters: [semesters],
      total: totalCount,
      offset: param.query.pageOffset,
    };
  }
}
