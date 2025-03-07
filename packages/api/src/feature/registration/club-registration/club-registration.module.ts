import { forwardRef, Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import ClubModule from "@sparcs-clubs/api/feature/club/club.module";
import DivisionModule from "@sparcs-clubs/api/feature/division/division.module";
import FileModule from "@sparcs-clubs/api/feature/file/file.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { ClubRegistrationController } from "./controller/club-registration.controller";
import { ClubRegistrationRepository } from "./repository/club-registration.repository";
import { ClubRegistrationPublicService } from "./service/club-registration.public.service";
import { ClubRegistrationService } from "./service/club-registration.service";

@Module({
  imports: [
    DrizzleModule,
    forwardRef(() => ClubModule),
    DivisionModule,
    FileModule,
    UserModule,
  ],
  controllers: [ClubRegistrationController],
  providers: [
    ClubRegistrationRepository,
    ClubRegistrationService,
    ClubRegistrationPublicService,
  ],
  exports: [ClubRegistrationPublicService],
})
export class ClubRegistrationModule {}
