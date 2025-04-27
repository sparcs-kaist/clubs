import { forwardRef, Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import DivisionModule from "../division/division.module";
import DivisionRepository from "../division/repository/division.repository";
import RegistrationModule from "../registration/registration.module";
import { SemesterModule } from "../semester/semester.module";
import UserModule from "../user/user.module";
import { ClubController } from "./controller/club.controller";
import { ClubDelegateDRepository } from "./delegate/club.club-delegate-d.repository";
import { DelegateModule } from "./delegate/delegate.module";
import { ClubRepository } from "./repository/club.repository";
import { ClubSemesterRepository } from "./repository/club-semester.repository";
import { ClubRoomTRepository } from "./repository-old/club.club-room-t.repository";
import ClubStudentTRepository from "./repository-old/club.club-student-t.repository";
import ClubTRepository from "./repository-old/club.club-t.repository";
import { DivisionPermanentClubDRepository } from "./repository-old/club.division-permanent-club-d.repository";
import { ClubGetStudentClubBrief } from "./repository-old/club.get-student-club-brief";
import { ClubPutStudentClubBrief } from "./repository-old/club.put-student-club-brief";
import { ClubOldRepository } from "./repository-old/club-old.repository";
import ClubPublicService from "./service/club.public.service";
import { ClubService } from "./service/club.service";

@Module({
  imports: [
    forwardRef(() => RegistrationModule),
    DrizzleModule,
    UserModule,
    forwardRef(() => DelegateModule),
    DivisionModule,
    SemesterModule,
  ],
  controllers: [ClubController],
  providers: [
    ClubService,
    ClubRoomTRepository,
    ClubRepository,
    ClubStudentTRepository,
    ClubTRepository,
    ClubStudentTRepository,
    DivisionPermanentClubDRepository,
    ClubPublicService,
    ClubGetStudentClubBrief,
    ClubPutStudentClubBrief,
    ClubDelegateDRepository,
    DivisionRepository,
    ClubOldRepository,
    ClubSemesterRepository,
  ],
  exports: [ClubPublicService],
})
export default class ClubModule {}
