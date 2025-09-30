import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import ActivityModule from "../activity/activity.module";
import ClubModule from "../club/club.module";
import FileModule from "../file/file.module";
import { OperationCommitteeModule } from "../operation-committee/operation-committee.module";
import { SemesterModule } from "../semester/semester.module";
import UserModule from "../user/user.module";
import FundingController from "./controller/funding.controller";
import { FundingCommentRepository } from "./repository/funding.comment.repository";
import FundingRepository from "./repository/funding.repository";
import FundingService from "./service/funding.service";

@Module({
  imports: [
    DrizzleModule,
    UserModule,
    ClubModule,
    ActivityModule,
    FileModule,
    OperationCommitteeModule,
    SemesterModule,
  ],
  controllers: [FundingController],
  providers: [FundingRepository, FundingService, FundingCommentRepository],
  exports: [],
})
export default class FundingModule {}
