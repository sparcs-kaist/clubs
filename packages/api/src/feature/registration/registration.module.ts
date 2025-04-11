import { forwardRef, Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import ClubModule from "@sparcs-clubs/api/feature/club/club.module";
import DivisionModule from "@sparcs-clubs/api/feature/division/division.module";
import FileModule from "@sparcs-clubs/api/feature/file/file.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { RegistrationController } from "./controller/registration.controller";
import { ClubRegistrationRepository } from "./repository/club-registration.repository";
import { MemberRegistrationRepository } from "./repository/member-registration.repository";
import { RegistrationPublicService } from "./service/registration.public.service";
import { RegistrationService } from "./service/registration.service";

@Module({
  imports: [
    DrizzleModule,
    forwardRef(() => ClubModule),
    DivisionModule,
    FileModule,
    UserModule,
  ],
  controllers: [RegistrationController],
  providers: [
    RegistrationService,
    RegistrationPublicService,
    ClubRegistrationRepository,
    MemberRegistrationRepository,
  ],
  exports: [RegistrationPublicService],
})
export class RegistrationModule {}
