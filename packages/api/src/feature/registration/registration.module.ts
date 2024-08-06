import { Module } from "@nestjs/common";

import { DrizzleModule } from "src/drizzle/drizzle.module";

import { ClubModule } from "../club/club.module";
// import ClubPublicService from "../club/service/club.public.service";

import { RegistrationController } from "./controller/registration.controller";
import { MemberRegistrationModule } from "./member-registration/member-registration.module";
import { RegistrationRepository } from "./repository/registration.repository";
import { RegistrationService } from "./service/registration.service";

@Module({
  imports: [DrizzleModule, ClubModule, MemberRegistrationModule],
  controllers: [RegistrationController],
  providers: [
    RegistrationRepository,
    RegistrationService,
    MemberRegistrationModule,
  ],
})
export class RegistrationModule {}
