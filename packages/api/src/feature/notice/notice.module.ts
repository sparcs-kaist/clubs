import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import { NoticeController } from "./controller/notice.controller";
import { NoticeRepository } from "./repository/notice.repository";
import { NoticeService } from "./service/notice.service";

@Module({
  imports: [DrizzleModule, ScheduleModule.forRoot()],
  controllers: [NoticeController],
  providers: [NoticeService, NoticeRepository],
})
export class NoticeModule {}
