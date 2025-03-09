import { Module } from "@nestjs/common";
import { DrizzleModule } from "src/drizzle/drizzle.module";

import { SemesterController } from "./controller/semester.controller";
import { ActivityDurationRepository } from "./repository/activity.activity-term.repository";
import { ActivityDeadlineRepository } from "./repository/activity.deadline.repository";
import { FundingDeadlineRepository } from "./repository/funding.deadline.repository";
import { RegistrationDeadlineRepository } from "./repository/registration.deadline.repository";
import { SemesterRepository } from "./repository/semester.repository";
import { SemesterPublicService } from "./service/semester.public.service";
import { SemesterService } from "./service/semester.service";

@Module({
  imports: [DrizzleModule],
  controllers: [SemesterController],
  providers: [
    SemesterService,
    SemesterPublicService,
    SemesterRepository,
    RegistrationDeadlineRepository,
    FundingDeadlineRepository,
    ActivityDeadlineRepository,
    ActivityDurationRepository,
  ],
  exports: [],
})
export default class SemesterModule {}
