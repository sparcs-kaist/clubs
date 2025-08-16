import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { ActivityDurationController } from "./controller/activity-duration.controller";
import { SemesterController } from "./controller/semester.controller";
import { ActivityDeadlinePublicService } from "./publicService/activity.deadline.public.service";
import { ActivityDurationPublicService } from "./publicService/activity.duration.public.service";
import { FundingDeadlinePublicService } from "./publicService/funding.deadline.public.service";
import { RegistrationDeadlinePublicService } from "./publicService/registration.deadline.public.service";
import { SemesterPublicService } from "./publicService/semester.public.service";
import { ActivityDeadlineRepository } from "./repository/activity.deadline.repository";
import { ActivityDurationRepository } from "./repository/activity.duration.repository";
import { FundingDeadlineRepository } from "./repository/funding.deadline.repository";
import { FundingDeadlineSqlRepository } from "./repository/funding.sql.repository";
import { RegistrationDeadlineRepository } from "./repository/registration.deadline.repository";
import { SemesterRepository } from "./repository/semester.repository";
import { SemesterSQLRepository } from "./repository/semester.sql.repository";
import { ActivityDurationService } from "./service/activity-duration.service";
import { FundingDeadlineService } from "./service/funding-deadline.service";
import { SemesterService } from "./service/semester.service";

@Module({
  imports: [DrizzleModule, UserModule],
  controllers: [SemesterController, ActivityDurationController],
  providers: [
    SemesterService,
    ActivityDurationService,
    SemesterPublicService,
    ActivityDurationPublicService,
    ActivityDeadlinePublicService,
    FundingDeadlinePublicService,
    RegistrationDeadlinePublicService,
    SemesterRepository,
    SemesterSQLRepository,
    ActivityDurationRepository,
    ActivityDeadlineRepository,
    FundingDeadlineRepository,
    FundingDeadlineSqlRepository,
    FundingDeadlineService,
    RegistrationDeadlineRepository,
  ],
  exports: [
    SemesterPublicService,
    ActivityDurationPublicService,
    ActivityDeadlinePublicService,
    FundingDeadlinePublicService,
    RegistrationDeadlinePublicService,
  ],
})
export class SemesterModule {}
