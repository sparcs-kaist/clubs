import { Module } from "@nestjs/common";
import { DrizzleModule } from "src/drizzle/drizzle.module";

import ClubModule from "../club/club.module";
import ClubTRepository from "../club/repository/club.club-t.repository";
import DivisionModule from "../division/division.module";
import FileModule from "../file/file.module";
import RegistrationModule from "../registration/registration.module";
import { SemesterModule } from "../semester/semester.module";
import UserModule from "../user/user.module";
import ActivityController from "./controller/activity.controller";
import ActivityClubChargedExecutiveRepository from "./repository/activity.activity-club-charged-executive.repository";
import ActivityRepository from "./repository/activity.repository";
import ActivityPublicService from "./service/activity.public.service";
import ActivityService from "./service/activity.service";

@Module({
  imports: [
    ClubModule,
    DivisionModule,
    DrizzleModule,
    FileModule,
    RegistrationModule,
    UserModule,
    SemesterModule,
  ],
  controllers: [ActivityController],
  providers: [
    ActivityRepository,
    ActivityClubChargedExecutiveRepository,
    ActivityService,
    ActivityPublicService,
    ClubTRepository,
  ],
  exports: [ActivityPublicService],
})
export default class ActivityModule {}
