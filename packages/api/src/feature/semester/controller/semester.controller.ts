import { Controller, Get, Query, UsePipes } from "@nestjs/common";

import apiAct018, {
  ApiAct018ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct018";
import type {
  ApiSem001RequestQuery,
  ApiSem001ResponseOK,
} from "@clubs/interface/api/semester/apiSem001";
import ApiSem001 from "@clubs/interface/api/semester/apiSem001";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Public } from "@sparcs-clubs/api/common/util/decorators/method-decorator";

import { SemesterService } from "../service/semester.service";

@Controller()
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Public()
  @Get("/public/semesters")
  @UsePipes(new ZodPipe(ApiSem001))
  async getPublicSemesters(
    @Query() query: ApiSem001RequestQuery,
  ): Promise<ApiSem001ResponseOK> {
    return this.semesterService.getPublicSemesters({ query });
  }

  @Public()
  @Get("/public/activities/deadline")
  @UsePipes(new ZodPipe(apiAct018))
  async getPublicActivitiesDeadline(): Promise<ApiAct018ResponseOk> {
    const result = await this.semesterService.getPublicActivitiesDeadline();
    return result;
  }
}
