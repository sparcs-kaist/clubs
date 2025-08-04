import {
  Body,
  Controller,
  Delete,
  Get,
  NotImplementedException,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
} from "@nestjs/common";

import type {
  ApiSem006RequestBody,
  ApiSem006ResponseCreated,
  ApiSem007RequestQuery,
  ApiSem007ResponseOK,
  ApiSem008RequestBody,
  ApiSem008RequestParam,
  ApiSem008ResponseNotImplemented,
  ApiSem009RequestBody,
  ApiSem009RequestParam,
  ApiSem009ResponseNotImplemented,
  ApiSem010RequestBody,
  ApiSem010RequestParam,
  ApiSem010ResponseOK,
} from "@clubs/interface/api/semester/index";
import {
  apiSem006,
  apiSem007,
  apiSem008,
  apiSem009,
  apiSem010,
} from "@clubs/interface/api/semester/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Executive,
  Public,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";

import { ActivityDurationService } from "../service/activity-duration.service";

@Controller()
export class ActivityDurationController {
  constructor(
    private readonly activityDurationService: ActivityDurationService,
  ) {}

  @Executive()
  @Post("/executive/semesters/activity-deadlines")
  @UsePipes(new ZodPipe(apiSem006))
  async createDeadline(
    @Body() body: ApiSem006RequestBody,
  ): Promise<ApiSem006ResponseCreated> {
    return this.activityDurationService.createActivityDeadline({ body });
  }

  @Public()
  @Get("/executive/semesters/activity-deadlines")
  @UsePipes(new ZodPipe(apiSem007))
  async getDeadlines(
    @Query() query: ApiSem007RequestQuery,
  ): Promise<ApiSem007ResponseOK> {
    return this.activityDurationService.getActivityDeadlines({ query });
  }

  @Executive()
  @Get("/public/activity-deadlines/:deadlineId")
  @UsePipes(new ZodPipe(apiSem008))
  async getDeadline(
    @Param() param: ApiSem008RequestParam,
    @Body() body: ApiSem008RequestBody,
  ): Promise<ApiSem008ResponseNotImplemented> {
    console.log(param, body);
    throw new NotImplementedException();
  }

  @Executive()
  @Put("/executive/semesters/:semesterId/activity-deadlines/:deadlineId")
  @UsePipes(new ZodPipe(apiSem009))
  async updateDeadline(
    @Param() param: ApiSem009RequestParam,
    @Body() body: ApiSem009RequestBody,
  ): Promise<ApiSem009ResponseNotImplemented> {
    console.log(param, body);
    throw new NotImplementedException();
  }

  @Executive()
  @Delete("/executive/semesters/:semesterId/activity-deadlines/:deadlineId")
  @UsePipes(new ZodPipe(apiSem010))
  async deleteDeadline(
    @Param() param: ApiSem010RequestParam,
    @Body() body: ApiSem010RequestBody,
  ): Promise<ApiSem010ResponseOK> {
    console.log(param, body);
    throw new NotImplementedException();
  }
}
