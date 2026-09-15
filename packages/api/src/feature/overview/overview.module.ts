import { Module } from "@nestjs/common";

import { ClubRepository } from "@sparcs-clubs/api/feature/club/repository/club.repository";
import { ClubDelegateRepository } from "@sparcs-clubs/api/feature/club/repository/club-delegate-repository";
import { ClubMemberRepository } from "@sparcs-clubs/api/feature/club/repository/club-member.repository";
import { ClubOverviewRoomRepository } from "@sparcs-clubs/api/feature/club/repository/overview-room/club-overview-room.repository";
import ClubTRepository from "@sparcs-clubs/api/feature/club/repository-old/club.club-t.repository";
import { OverviewController } from "@sparcs-clubs/api/feature/overview/controller/overview.controller";
import { OverviewRepository } from "@sparcs-clubs/api/feature/overview/repository/overview.repository";
import { OverviewService } from "@sparcs-clubs/api/feature/overview/service/overview.service";
import { MemberRegistrationRepository } from "@sparcs-clubs/api/feature/registration/repository/member-registration.repository";
import { UserOverviewRepository } from "@sparcs-clubs/api/feature/user/repository/sso-login/user-overview.repository";

@Module({
  imports: [],
  controllers: [OverviewController],
  providers: [
    OverviewService,
    OverviewRepository,
    ClubRepository,
    ClubDelegateRepository,
    ClubTRepository,
    ClubOverviewRoomRepository,
    UserOverviewRepository,
    ClubMemberRepository,
    MemberRegistrationRepository,
  ],
})
export class OverviewModule {}
