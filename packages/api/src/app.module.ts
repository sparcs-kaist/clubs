import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DrizzleModule } from "./drizzle/drizzle.module";
import ActivityModule from "./feature/activity/activity.module";
import { ActivityCertificateModule } from "./feature/activity-certificate/activity-certificate.module";
import { AuthModule } from "./feature/auth/auth.module";
import { JwtAccessGuard } from "./feature/auth/guard/jwt-access.guard";
import ClubModule from "./feature/club/club.module";
import DivisionModule from "./feature/division/division.module";
import FileModule from "./feature/file/file.module";
import FundingModule from "./feature/funding/funding.module";
import { NoticeModule } from "./feature/notice/notice.module";
import { OverviewModule } from "./feature/overview/overview.module";
import RegistrationModule from "./feature/registration/registration.module";
import { SemesterModule } from "./feature/semester/semester.module";
import UserModule from "./feature/user/user.module";

@Module({
  imports: [
    ActivityModule,
    ClubModule,
    DivisionModule,
    DrizzleModule,
    FileModule,
    FundingModule,
    NoticeModule,
    RegistrationModule,
    UserModule,
    ActivityCertificateModule,
    AuthModule,
    SemesterModule,
    OverviewModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAccessGuard,
    },
  ],
})
export class AppModule {}
