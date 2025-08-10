import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import ClubModule from "../club/club.module";
import DivisionModule from "../division/division.module";
import FileModule from "../file/file.module";
import { OperationCommitteeModule } from "../operation-committee/operation-committee.module";
import RegistrationModule from "../registration/registration.module";
import { SemesterModule } from "../semester/semester.module";
import UserModule from "../user/user.module";
import ActivityController from "./controller/activity.controller";
import { ActivityNewRepository } from "./repository/activity.new.repository";
import ActivityRepository from "./repository/activity.repository";
import { ActivityClubChargedExecutiveRepository } from "./repository/activity-club-charge-executive.repository";
import { ActivityCommentRepository } from "./repository/activity-comment.repository";
import ActivityPublicService from "./service/activity.public.service";
import ActivityOldService from "./service/activity.service";
import ActivityService from "./service/activity.service.new";

@Module({
  imports: [
    ClubModule,
    DivisionModule,
    DrizzleModule,
    FileModule,
    RegistrationModule,
    UserModule,
    OperationCommitteeModule,
    SemesterModule,
  ],
  controllers: [ActivityController],
  providers: [
    ActivityRepository,
    ActivityService,
    ActivityOldService,
    ActivityPublicService,
    ActivityNewRepository,
    ActivityClubChargedExecutiveRepository,
    ActivityCommentRepository,
  ],
  exports: [ActivityPublicService],
})
export default class ActivityModule {}
