import { Module } from "@nestjs/common";

import { OverviewController } from "@sparcs-clubs/api/feature/overview/controller/overview.controller";
import { OverviewRepository } from "@sparcs-clubs/api/feature/overview/repository/overview.repository";
import { OverviewService } from "@sparcs-clubs/api/feature/overview/service/overview.service";

@Module({
  imports: [],
  controllers: [OverviewController],
  providers: [OverviewService, OverviewRepository],
})
export class OverviewModule {}
