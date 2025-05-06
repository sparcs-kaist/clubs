import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import { OverviewController } from "./controller/overview.controller";
import { OverviewService } from "./service/overview.service";

@Module({
  imports: [DrizzleModule],
  controllers: [OverviewController],
  providers: [OverviewService],
})
export class OverviewModule {}
