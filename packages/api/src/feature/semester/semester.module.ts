import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import { SemesterController } from "./controller/semester.controller";
import { ActivityDeadlinePublicService } from "./publicService/activity.deadline.public.service";
import { ActivityDurationPublicService } from "./publicService/activity.duration.public.service";
import { FundingDeadlinePublicService } from "./publicService/funding.deadline.public.service";
import { RegistrationDeadlinePublicService } from "./publicService/registration.deadline.public.service";
import { SemesterPublicService } from "./publicService/semester.public.service";
import { ActivityDeadlineRepository } from "./repository/activity.deadline.repository";
import { ActivityDurationRepository } from "./repository/activity.duration.repository";
import { FundingDeadlineRepository } from "./repository/funding.deadline.repository";
import { RegistrationDeadlineRepository } from "./repository/registration.deadline.repository";
import { SemesterRepository } from "./repository/semester.repository";
import { SemesterSQLRepository } from "./repository/semester.sql.repository";
import { SemesterService } from "./service/semester.service";

@Module({
  imports: [DrizzleModule],
  controllers: [SemesterController],
  providers: [
    SemesterService,
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
