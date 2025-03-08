import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import ClubModule from "@sparcs-clubs/api/feature/club/club.module";
import DivisionModule from "@sparcs-clubs/api/feature/division/division.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { MemberRegistrationController } from "./controller/member-registration.controller";
import { MemberRegistrationRepository } from "./repository/member-registration.repository";
import { MemberRegistrationService } from "./service/member-registration.service";

@Module({
  imports: [ClubModule, UserModule, DrizzleModule, DivisionModule],
  controllers: [MemberRegistrationController],
  providers: [MemberRegistrationService, MemberRegistrationRepository],
})
export class MemberRegistrationModule {}
