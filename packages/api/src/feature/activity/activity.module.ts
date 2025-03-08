import { Module } from "@nestjs/common";
import { DrizzleModule } from "src/drizzle/drizzle.module";

import ClubModule from "../club/club.module";
import ClubTRepository from "../club/repository/club.club-t.repository";
import DivisionModule from "../division/division.module";
import FileModule from "../file/file.module";
import { ClubRegistrationModule } from "../registration/club-registration/club-registration.module";
import ActivityActivityTermRepository from "../semester/repository/activity.activity-term.repository";
import UserModule from "../user/user.module";
import ActivityActivityTermController from "./controller/activity.activity-term.controller";
import ActivityController from "./controller/activity.controller";
import ActivityClubChargedExecutiveRepository from "./repository/activity.activity-club-charged-executive.repository";
import ActivityRepository from "./repository/activity.repository";
import ActivityActivityTermService from "./service/activity.activity-term.service";
import ActivityPublicService from "./service/activity.public.service";
import ActivityService from "./service/activity.service";

@Module({
  imports: [
    ClubModule,
    DivisionModule,
    DrizzleModule,
    FileModule,
    ClubRegistrationModule,
    UserModule,
  ],
  controllers: [ActivityController, ActivityActivityTermController],
  providers: [
    ActivityRepository,
    ActivityActivityTermRepository,
    ActivityClubChargedExecutiveRepository,
    ActivityService,
    ActivityActivityTermService,
    ActivityPublicService,
    ClubTRepository,
  ],
  exports: [ActivityPublicService],
})
export default class ActivityModule {}
