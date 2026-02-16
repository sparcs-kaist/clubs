import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { MeetingRepository } from "../meeting.repository";
import AgendaController from "./agenda.controller";
import { AgendaService } from "./agenda.service";

@Module({
  imports: [DrizzleModule, UserModule],
  providers: [AgendaService, MeetingRepository],
  controllers: [AgendaController],
})
export class AgendaModule {}
