import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UsePipes,
} from "@nestjs/common";

import type {
  ApiAct001RequestBody,
  ApiAct001ResponseCreated,
} from "@clubs/interface/api/activity/endpoint/apiAct001";
import apiAct001 from "@clubs/interface/api/activity/endpoint/apiAct001";
import type {
  ApiAct002RequestParam,
  ApiAct002ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct002";
import apiAct002 from "@clubs/interface/api/activity/endpoint/apiAct002";
import type {
  ApiAct003RequestBody,
  ApiAct003RequestParam,
  ApiAct003ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct003";
import apiAct003 from "@clubs/interface/api/activity/endpoint/apiAct003";
import type {
  ApiAct004RequestParam,
  ApiAct004ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct004";
import apiAct004 from "@clubs/interface/api/activity/endpoint/apiAct004";
import type {
  ApiAct005RequestQuery,
  ApiAct005ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct005";
import apiAct005 from "@clubs/interface/api/activity/endpoint/apiAct005";
import type {
  ApiAct006RequestParam,
  ApiAct006RequestQuery,
  ApiAct006ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct006";
import apiAct006 from "@clubs/interface/api/activity/endpoint/apiAct006";
import apiAct007, {
  ApiAct007RequestBody,
  ApiAct007ResponseCreated,
} from "@clubs/interface/api/activity/endpoint/apiAct007";
import apiAct008, {
  ApiAct008RequestBody,
  ApiAct008RequestParam,
  ApiAct008ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct008";
import type {
  ApiAct010RequestQuery,
  ApiAct010ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct010";
import apiAct010 from "@clubs/interface/api/activity/endpoint/apiAct010";
import type {
  ApiAct011RequestQuery,
  ApiAct011ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct011";
import apiAct011 from "@clubs/interface/api/activity/endpoint/apiAct011";
import type {
  ApiAct012RequestQuery,
  ApiAct012ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct012";
import apiAct012 from "@clubs/interface/api/activity/endpoint/apiAct012";
import type {
  ApiAct013RequestQuery,
  ApiAct013ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct013";
import apiAct013 from "@clubs/interface/api/activity/endpoint/apiAct013";
import type {
  ApiAct014RequestParam,
  ApiAct014ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct014";
import apiAct014 from "@clubs/interface/api/activity/endpoint/apiAct014";
import type {
  ApiAct015RequestParam,
  ApiAct015ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct015";
import apiAct015 from "@clubs/interface/api/activity/endpoint/apiAct015";
import type {
  ApiAct016RequestParam,
  ApiAct016ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct016";
import apiAct016 from "@clubs/interface/api/activity/endpoint/apiAct016";
import type {
  ApiAct017RequestBody,
  ApiAct017RequestParam,
  ApiAct017ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct017";
import apiAct017 from "@clubs/interface/api/activity/endpoint/apiAct017";
import type { ApiAct018ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct018";
import apiAct018 from "@clubs/interface/api/activity/endpoint/apiAct018";
import apiAct019, {
  ApiAct019RequestQuery,
  ApiAct019ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct019";
import apiAct020, {
  ApiAct020RequestBody,
  ApiAct020ResponseCreated,
} from "@clubs/interface/api/activity/endpoint/apiAct020";
import apiAct021, {
  type ApiAct021RequestQuery,
  ApiAct021RequestUrl,
  type ApiAct021ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct021";
import apiAct022, {
  ApiAct022RequestParam,
  ApiAct022RequestUrl,
  type ApiAct022ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct022";
import type { ApiAct023ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct023";
import apiAct023 from "@clubs/interface/api/activity/endpoint/apiAct023";
import type {
  ApiAct024RequestQuery,
  ApiAct024ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct024";
import apiAct024 from "@clubs/interface/api/activity/endpoint/apiAct024";
import type {
  ApiAct025RequestBody,
  ApiAct025ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct025";
import apiAct025 from "@clubs/interface/api/activity/endpoint/apiAct025";
import type {
  ApiAct026RequestBody,
  ApiAct026ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct026";
import apiAct026 from "@clubs/interface/api/activity/endpoint/apiAct026";
import apiAct027, {
  type ApiAct027RequestQuery,
  ApiAct027RequestUrl,
  type ApiAct027ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct027";
import apiAct028, {
  ApiAct028RequestParam,
  ApiAct028RequestUrl,
  type ApiAct028ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct028";
import apiAct029, {
  ApiAct029RequestParam,
  ApiAct029RequestUrl,
  ApiAct029ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct029";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Executive,
  Professor,
  Public,
  Student,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import {
  GetExecutive,
  GetProfessor,
  GetStudent,
} from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import ActivityService from "../service/activity.service";

@Controller()
export default class ActivityController {
  constructor(private activityService: ActivityService) {}

  // TODO: Authentication 필요
  @Student()
  @Delete("/student/activities/activity/:activityId")
  @UsePipes(new ZodPipe(apiAct004))
  async deleteStudentActivity(
    @GetStudent() user: GetStudent,
    @Param() param: ApiAct004RequestParam,
  ): Promise<ApiAct004ResponseOk> {
    await this.activityService.deleteStudentActivity(
      param.activityId,
      user.studentId,
    );

    return {};
  }

  // TODO: Authentication 필요
  @Student()
  @Get("/student/activities")
  @UsePipes(new ZodPipe(apiAct005))
  async getStudentActivities(
    @GetStudent() user: GetStudent,
    @Query() query: ApiAct005RequestQuery,
  ): Promise<ApiAct005ResponseOk> {
    const result = await this.activityService.getStudentActivities(
      query.clubId,
      user.studentId,
    );
    return result;
  }

  // TODO: Authentication 필요
  @Student()
  @Get("/student/activities/activity/:activityId")
  @UsePipes(new ZodPipe(apiAct002))
  async getStudentActivity(
    @GetStudent() user: GetStudent,
    @Param() param: ApiAct002RequestParam,
  ): Promise<ApiAct002ResponseOk> {
    const result = await this.activityService.getStudentActivity(
      param.activityId,
      // user.studentId,
    );

    return result;
  }

  // TODO: Authentication 필요
  @Student()
  @Post("/student/activities/activity")
  @UsePipes(new ZodPipe(apiAct001))
  async postStudentActivity(
    @GetStudent() user: GetStudent,
    @Body() body: ApiAct001RequestBody,
  ): Promise<ApiAct001ResponseCreated> {
    await this.activityService.postStudentActivity(body, user.studentId);
    return {};
  }

  // TODO: Authentication 필요
  @Student()
  @Put("/student/activities/activity/:activityId")
  @UsePipes(new ZodPipe(apiAct003))
  async putStudentActivity(
    @GetStudent() user: GetStudent,
    @Param() param: ApiAct003RequestParam,
    @Body() body: ApiAct003RequestBody,
  ): Promise<ApiAct003ResponseOk> {
    await this.activityService.putStudentActivity(param, body, user.studentId);
    return {};
  }

  @Student()
  @Post("/student/activities/activity/provisional")
  @UsePipes(new ZodPipe(apiAct007))
  async postStudentActivityProvisional(
    @GetStudent() user: GetStudent,
    @Body() body: ApiAct007RequestBody,
  ): Promise<ApiAct007ResponseCreated> {
    await this.activityService.postStudentActivityProvisional(
      body,
      user.studentId,
    );
    return {};
  }

  @Student()
  @Put("/student/activities/activity/:activityId/provisional")
  @UsePipes(new ZodPipe(apiAct008))
  async putStudentActivityProvisional(
    @GetStudent() user: GetStudent,
    @Param() param: ApiAct008RequestParam,
    @Body() body: ApiAct008RequestBody,
  ): Promise<ApiAct008ResponseOk> {
    await this.activityService.putStudentActivityProvisional(
      param,
      body,
      user.studentId,
    );
    return {};
  }

  @Student()
  @Delete("/student/activities/activity/:activityId/provisional")
  @UsePipes(new ZodPipe(apiAct004))
  async deleteStudentActivityProvisional(
    @GetStudent() user: GetStudent,
    @Param() param: ApiAct004RequestParam,
  ): Promise<ApiAct004ResponseOk> {
    await this.activityService.deleteStudentActivityProvisional(
      param.activityId,
      user.studentId,
    );
    return {};
  }

  @Student()
  @Get("/student/activities/available-members")
  @UsePipes(new ZodPipe(apiAct010))
  async getStudentActivitiesAvailableMembers(
    @GetStudent() user: GetStudent,
    @Query() query: ApiAct010RequestQuery,
  ): Promise<ApiAct010ResponseOk> {
    const result =
      await this.activityService.getStudentActivitiesAvailableMembers({
        studentId: user.studentId,
        query,
      });
    return result;
  }

  @Student()
  @Get("/student/provisional/activities")
  @UsePipes(new ZodPipe(apiAct011))
  async getStudentProvisionalActivities(
    @GetStudent() user: GetStudent,
    @Query() query: ApiAct011RequestQuery,
  ): Promise<ApiAct011ResponseOk> {
    const result = await this.activityService.getStudentProvisionalActivities({
      studentId: user.studentId,
      query,
    });

    return result;
  }

  @Executive()
  @Get("/executive/provisional/activities")
  @UsePipes(new ZodPipe(apiAct012))
  async getExecutiveProvisionalActivities(
    @Query() query: ApiAct012RequestQuery,
  ): Promise<ApiAct012ResponseOk> {
    const result = await this.activityService.getExecutiveProvisionalActivities(
      {
        query,
      },
    );

    return result;
  }

  @Professor()
  @Get("/professor/provisional/activities")
  @UsePipes(new ZodPipe(apiAct013))
  async getProfessorProvisionalActivities(
    @Query() query: ApiAct013RequestQuery,
  ): Promise<ApiAct013ResponseOk> {
    const result = await this.activityService.getProfessorProvisionalActivities(
      {
        query,
      },
    );

    return result;
  }

  @Executive()
  @Get("/executive/activities/activity/:activityId")
  @UsePipes(new ZodPipe(apiAct014))
  async getExecutiveActivity(
    @Param() param: ApiAct014RequestParam,
  ): Promise<ApiAct014ResponseOk> {
    const result = await this.activityService.getExecutiveActivity(
      param.activityId,
    );

    return result;
  }

  @Professor()
  @Get("/professor/activities/activity/:activityId")
  @UsePipes(new ZodPipe(apiAct015))
  async getProfessorActivity(
    @Param() param: ApiAct015RequestParam,
    @GetProfessor() user: GetProfessor,
  ): Promise<ApiAct015ResponseOk> {
    const result = await this.activityService.getProfessorActivity(
      param.activityId,
      user.professorId,
    );

    return result;
  }

  @Executive()
  @Patch("/executive/activities/activity/:activityId/approval")
  @UsePipes(new ZodPipe(apiAct016))
  async patchExecutiveActivityApproval(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiAct016RequestParam,
  ): Promise<ApiAct016ResponseOk> {
    const result = await this.activityService.patchExecutiveActivityApproval({
      executiveId: user.executiveId,
      param,
    });
    return result;
  }

  @Executive()
  @Patch("/executive/activities/activity/:activityId/send-back")
  @UsePipes(new ZodPipe(apiAct017))
  async patchExecutiveActivitySendBack(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiAct017RequestParam,
    @Body() body: ApiAct017RequestBody,
  ): Promise<ApiAct017ResponseOk> {
    const result = await this.activityService.patchExecutiveActivitySendBack({
      executiveId: user.executiveId,
      param,
      body,
    });
    return result;
  }

  @Public()
  @Get("/public/activities/deadline")
  @UsePipes(new ZodPipe(apiAct018))
  async getPublicActivitiesDeadline(): Promise<ApiAct018ResponseOk> {
    const result = await this.activityService.getPublicActivitiesDeadline();
    return result;
  }

  @Professor()
  @Get("/professor/activities")
  @UsePipes(new ZodPipe(apiAct019))
  async getProfessorActivities(
    @GetProfessor() user: GetProfessor,
    @Query() query: ApiAct019RequestQuery,
  ): Promise<ApiAct019ResponseOk> {
    const result = await this.activityService.getProfessorActivities(
      query.clubId,
      user.professorId,
    );
    return result;
  }

  @Professor()
  @Post("/professor/activities/approve")
  @UsePipes(new ZodPipe(apiAct020))
  async postProfessorActivityApprove(
    @GetProfessor() user: GetProfessor,
    @Body() body: ApiAct020RequestBody,
  ): Promise<ApiAct020ResponseCreated> {
    await this.activityService.postProfessorActivityApprove(
      body.activities.map(activity => activity.id),
      user.professorId,
    );
    return {};
  }

  @Executive()
  @Get("/executive/activities/clubs")
  @UsePipes(new ZodPipe(apiAct023))
  async getExecutiveActivitiesClubs(): Promise<ApiAct023ResponseOk> {
    const result = await this.activityService.getExecutiveActivitiesClubs();
    return result;
  }

  @Executive()
  @Get("/executive/activities/club-brief")
  @UsePipes(new ZodPipe(apiAct024))
  async getExecutiveActivitiesClubBrief(
    @GetExecutive() user: GetExecutive,
    @Query() query: ApiAct024RequestQuery,
  ): Promise<ApiAct024ResponseOk> {
    if (query.semesterId !== undefined) {
      console.log("semesterId filter of ACT-024 is not yet implemented");
    }
    const result = await this.activityService.getExecutiveActivitiesClubBrief({
      query,
    });
    return result;
  }

  @Executive()
  @Patch("/executive/activities")
  @UsePipes(new ZodPipe(apiAct025))
  async patchExecutiveActivities(
    @GetExecutive() user: GetExecutive,
    @Body() body: ApiAct025RequestBody,
  ): Promise<ApiAct025ResponseOk> {
    await this.activityService.patchExecutiveActivities({
      body,
    });
    return {};
  }

  @Executive()
  @Put("/executive/activities/club-charged-executive")
  @UsePipes(new ZodPipe(apiAct026))
  async putExecutiveActivitiesClubChargedExecutive(
    @GetExecutive() user: GetExecutive,
    @Body() body: ApiAct026RequestBody,
  ): Promise<ApiAct026ResponseOk> {
    await this.activityService.putExecutiveActivitiesClubChargedExecutive({
      body,
    });
    return {};
  }

  @Executive()
  @Get(ApiAct027RequestUrl)
  @UsePipes(new ZodPipe(apiAct027))
  async getExecutiveActivitiesClubChargeAvailableExecutives(
    @Query() query: ApiAct027RequestQuery,
  ): Promise<ApiAct027ResponseOk> {
    const result =
      await this.activityService.getExecutiveActivitiesClubChargeAvailableExecutives(
        query,
      );
    return result;
  }

  @Student()
  @Get(ApiAct021RequestUrl)
  @UsePipes(new ZodPipe(apiAct021))
  async getStudentActivitiesAvailable(
    @GetStudent() user: GetStudent,
    @Query() query: ApiAct021RequestQuery,
  ): Promise<ApiAct021ResponseOk> {
    return this.activityService.getStudentActivitiesAvailable(
      user.studentId,
      query.clubId,
    );
  }

  @Student()
  @Get(ApiAct022RequestUrl)
  @UsePipes(new ZodPipe(apiAct022))
  async getStudentActivityParticipants(
    @GetStudent() user: GetStudent,
    @Param() param: ApiAct022RequestParam,
  ): Promise<ApiAct022ResponseOk> {
    return this.activityService.getStudentActivityParticipants(param.id);
  }

  @Executive()
  @Get(ApiAct028RequestUrl)
  @UsePipes(new ZodPipe(apiAct028))
  async getExecutiveActivitiesExecutiveBrief(
    @Param() param: ApiAct028RequestParam,
  ): Promise<ApiAct028ResponseOk> {
    return this.activityService.getExecutiveActivitiesExecutiveBrief(
      param.executiveId,
    );
  }

  @Student()
  @Get(ApiAct029RequestUrl)
  @UsePipes(new ZodPipe(apiAct029))
  async getStudentActivityProvisional(
    @Param() param: ApiAct029RequestParam,
  ): Promise<ApiAct029ResponseOk> {
    return this.activityService.getStudentActivityProvisional(param.activityId);
  }

  @Student()
  @Get("/student/activities/activity-terms/activity-term/:activityTermId")
  @UsePipes(new ZodPipe(apiAct006))
  async getStudentActivitiesActivityTerm(
    @GetStudent() user: GetStudent,
    @Param() param: ApiAct006RequestParam,
    @Query() query: ApiAct006RequestQuery,
  ): Promise<ApiAct006ResponseOk> {
    const result = await this.activityService.getStudentActivitiesActivityTerm(
      param,
      query,
      user.studentId,
    );
    return result;
  }
}
