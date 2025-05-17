import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import { OverviewController } from "@sparcs-clubs/api/feature/overview/controller/overview.controller";
import { OverviewRepository } from "@sparcs-clubs/api/feature/overview/repository/overview.repository";
import { OverviewService } from "@sparcs-clubs/api/feature/overview/service/overview.service";

@Module({
  imports: [DrizzleModule],
  controllers: [OverviewController],
  providers: [OverviewService, OverviewRepository],
})
export class OverviewModule {}
