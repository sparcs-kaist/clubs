import { Module } from "@nestjs/common";
import { DrizzleModule } from "src/drizzle/drizzle.module";

import { SemesterController } from "./controller/semester.controller";
import { ActivityDeadlinePublicService } from "./publicService/activity.deadline.public.service";
import { FundingDeadlinePublicService } from "./publicService/funding.deadline.public.service";
import { RegistrationDeadlinePublicService } from "./publicService/registration.deadline.public.service";
import { SemesterPublicService } from "./publicService/semester.public.service";
import { ActivityDeadlineRepository } from "./repository/activity.deadline.repository";
import { ActivityDurationRepository } from "./repository/activity.duration.repository";
import { FundingDeadlineRepository } from "./repository/funding.deadline.repository";
import { RegistrationDeadlineRepository } from "./repository/registration.deadline.repository";
import { SemesterRepository } from "./repository/semester.repository";
import { SemesterService } from "./service/semester.service";

@Module({
  imports: [DrizzleModule],
  controllers: [SemesterController],
  providers: [
    SemesterService,
    SemesterPublicService,
    ActivityDeadlinePublicService,
    FundingDeadlinePublicService,
    RegistrationDeadlinePublicService,
    SemesterRepository,
    RegistrationDeadlineRepository,
    FundingDeadlineRepository,
    ActivityDeadlineRepository,
    ActivityDurationRepository,
  ],
  exports: [
    SemesterPublicService,
    ActivityDeadlinePublicService,
    FundingDeadlinePublicService,
    RegistrationDeadlinePublicService,
  ],
})
export default class SemesterModule {}
