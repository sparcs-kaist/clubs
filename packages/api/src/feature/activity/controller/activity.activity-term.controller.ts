import { Controller, Get, Param, Query, UsePipes } from "@nestjs/common";

import type {
  ApiAct006RequestParam,
  ApiAct006RequestQuery,
  ApiAct006ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct006";
import apiAct006 from "@clubs/interface/api/activity/endpoint/apiAct006";
import type {
  ApiAct009RequestQuery,
  ApiAct009ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct009";
import apiAct009 from "@clubs/interface/api/activity/endpoint/apiAct009";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Student } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetStudent } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import ActivityActivityTermService from "../service/activity.activity-term.service";

@Controller()
export default class ActivityActivityTermController {
  constructor(
    private activityActivityTermService: ActivityActivityTermService,
  ) {}

  @Student()
  @Get("/student/activities/activity-terms")
  @UsePipes(new ZodPipe(apiAct009))
  async getStudentActivitiesActivityTerms(
    @GetStudent() user: GetStudent,
    @Query() query: ApiAct009RequestQuery,
  ): Promise<ApiAct009ResponseOk> {
    const result =
      await this.activityActivityTermService.getStudentActivitiesActivityTerms(
        query,
        user.studentId,
      );
    return result;
  }

  @Student()
  @Get("/student/activities/activity-terms/activity-term/:activityTermId")
  @UsePipes(new ZodPipe(apiAct006))
  async getStudentActivitiesActivityTerm(
    @GetStudent() user: GetStudent,
    @Param() param: ApiAct006RequestParam,
    @Query() query: ApiAct006RequestQuery,
  ): Promise<ApiAct006ResponseOk> {
    const result =
      await this.activityActivityTermService.getStudentActivitiesActivityTerm(
        param,
        query,
        user.studentId,
      );
    return result;
  }
}
