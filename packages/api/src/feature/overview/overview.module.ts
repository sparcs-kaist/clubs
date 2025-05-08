import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import { ClubDelegateRepository } from "@sparcs-clubs/api/feature/club/repository/club-delegate-repository";
import { ClubOldRepository } from "@sparcs-clubs/api/feature/club/repository-old/club-old.repository";
import { OverviewController } from "@sparcs-clubs/api/feature/overview/controller/overview.controller";
import { OverviewRepository } from "@sparcs-clubs/api/feature/overview/repository/overview.repository";
import { OverviewService } from "@sparcs-clubs/api/feature/overview/service/overview.service";
import StudentRepository from "@sparcs-clubs/api/feature/user/repository/student.repository";

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
