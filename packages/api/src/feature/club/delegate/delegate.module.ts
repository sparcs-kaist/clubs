import { forwardRef, Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import { SemesterModule } from "@sparcs-clubs/api/feature/semester/semester.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import ClubModule from "../club.module";
import { ClubDelegateDRepository } from "./club.club-delegate-d.repository";
import ClubDelegateController from "./delegate.controller";
import ClubDelegateService from "./delegate.service";

@Module({
  imports: [
    DrizzleModule,
    UserModule,
    forwardRef(() => ClubModule),
    SemesterModule,
  ],
  providers: [ClubDelegateService, ClubDelegateDRepository],
  controllers: [ClubDelegateController],
})
export class DelegateModule {}
