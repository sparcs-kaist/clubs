import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import { ClubDelegateRepository } from "../club/repository/club-delegate-repository";
import { ClubOldRepository } from "../club/repository-old/club-old.repository";
import StudentRepository from "../user/repository/student.repository";
import { OverviewController } from "./controller/overview.controller";
import { OverviewRepository } from "./repository/overview.repository";
import { OverviewService } from "./service/overview.service";

@Module({
  imports: [DrizzleModule],
  controllers: [OverviewController],
  providers: [
    OverviewService,
    OverviewRepository,
    ClubDelegateRepository,
    StudentRepository,
    ClubOldRepository,
  ],
})
export class OverviewModule {}
