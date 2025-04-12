import { Body, Controller, Get, Post, Query, UsePipes } from "@nestjs/common";

import apiAcf001, {
  ApiAcf001RequestBody,
  ApiAcf001ResponseCreated,
} from "@clubs/interface/api/activity-certificate/endpoint/apiAcf001";
import apiAcf002, {
  ApiAcf002ResponseOk,
} from "@clubs/interface/api/activity-certificate/endpoint/apiAcf002";
import type {
  ApiAcf003RequestQuery,
  ApiAcf003ResponseOk,
} from "@clubs/interface/api/activity-certificate/endpoint/apiAcf003";
import apiAcf003 from "@clubs/interface/api/activity-certificate/endpoint/apiAcf003";
import type {
  ApiAcf007RequestQuery,
  ApiAcf007ResponseOk,
} from "@clubs/interface/api/activity-certificate/endpoint/apiAcf007";
import apiAcf007 from "@clubs/interface/api/activity-certificate/endpoint/apiAcf007";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Student } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetStudent } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { ActivityCertificateService } from "../service/activity-certificate.service";

@Controller()
export class ActivityCertificateController {
  constructor(
    private readonly activityCertificateService: ActivityCertificateService,
  ) {}

  @Post("/student/activity-certificates/activity-certificate")
  @UsePipes(new ZodPipe(apiAcf001))
  async postActivityCertificate(
    @Body() body: ApiAcf001RequestBody,
  ): Promise<ApiAcf001ResponseCreated> {
    await this.activityCertificateService.postActivityCertificate(body);
    return {};
  }

  @Student()
  @Get("/student/activity-certificates/club-history")
  @UsePipes(new ZodPipe(apiAcf002))
  async getStudentActivityCertificatesClubHistory(
    @GetStudent() user: GetStudent,
  ): Promise<ApiAcf002ResponseOk> {
    const clubHistory =
      await this.activityCertificateService.getStudentActivityCertificatesClubHistory(
        { studentId: user.studentId },
      );
    return clubHistory;
  }

  // // TODO: add club validation
  @Get("/student/activity-certificates")
  @UsePipes(new ZodPipe(apiAcf003))
  async getStudentActivityCertificates(
    @Query() query: ApiAcf003RequestQuery,
  ): Promise<ApiAcf003ResponseOk> {
    const orders =
      await this.activityCertificateService.getStudentActivityCertificates(
        query,
      );

    return orders;
  }

  @Get("/student/activity-certificates/my")
  @UsePipes(new ZodPipe(apiAcf007))
  async getStudentActivityCertificatesMy(
    @Query() query: ApiAcf007RequestQuery,
  ): Promise<ApiAcf007ResponseOk> {
    const orders =
      await this.activityCertificateService.getStudentActivityCertificatesMy(
        query,
      );

    return orders;
  }
}
