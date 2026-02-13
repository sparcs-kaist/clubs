import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { MeetingRepository } from "../meeting.repository";
import { AnnouncementController } from "./announcement.controller";
import { AnnouncementService } from "./announcement.service";

@Module({
  imports: [DrizzleModule, UserModule],
  providers: [AnnouncementService, MeetingRepository],
  controllers: [AnnouncementController],
})
export class AnnouncementModule {}
