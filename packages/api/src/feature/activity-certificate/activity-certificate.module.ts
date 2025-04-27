import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import ClubModule from "@sparcs-clubs/api/feature/club/club.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { ClubDelegateDRepository } from "../club/delegate/club.club-delegate-d.repository";
import { ActivityCertificateController } from "./controller/activity-certificate.controller";
import { ActivityCertificateRepository } from "./repository/activity-certificate.repository";
import { ActivityCertificateService } from "./service/activity-certificate.service";

@Module({
  imports: [DrizzleModule, UserModule, ClubModule],
  controllers: [ActivityCertificateController],
  providers: [
    ActivityCertificateService,
    ActivityCertificateRepository,
    ClubDelegateDRepository,
  ],
})
export class ActivityCertificateModule {}
