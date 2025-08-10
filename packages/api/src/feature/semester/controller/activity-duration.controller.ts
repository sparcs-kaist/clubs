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
  ApiSem010RequestParam,
  ApiSem010ResponseOK,
  ApiSem011RequestBody,
  ApiSem011RequestQuery,
  ApiSem011ResponseNotImplemented,
  ApiSem012RequestQuery,
  ApiSem012ResponseOK,
  ApiSem013RequestBody,
  ApiSem013RequestParam,
  ApiSem013ResponseNotImplemented,
  ApiSem014RequestParam,
  ApiSem014ResponseNotImplemented,
} from "@clubs/interface/api/semester/index";
import {
  apiSem006,
  apiSem007,
  apiSem008,
  apiSem009,
  apiSem010,
  apiSem011,
  apiSem012,
  apiSem013,
  apiSem014,
} from "@clubs/interface/api/semester/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";
import logger from "@sparcs-clubs/api/common/util/logger";

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

  @Executive()
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
    @GetExecutive() executive: GetExecutive,
    @Param() _param: ApiSem008RequestParam,
    @Body() _body: ApiSem008RequestBody,
  ): Promise<ApiSem008ResponseNotImplemented> {
    logger.info(
      `User excutive_id: ${executive.id} trying to call unimplemeneted feature`,
    );
    throw new NotImplementedException();
  }

  @Executive()
  @Put("/executive/semesters/:semesterId/activity-deadlines/:deadlineId")
  @UsePipes(new ZodPipe(apiSem009))
  async updateDeadline(
    @GetExecutive() executive: GetExecutive,
    @Param() _param: ApiSem009RequestParam,
    @Body() _body: ApiSem009RequestBody,
  ): Promise<ApiSem009ResponseNotImplemented> {
    logger.info(
      `User excutive_id: ${executive.id} trying to call unimplemeneted feature`,
    );
    throw new NotImplementedException();
  }

  @Executive()
  @Delete("/executive/semesters/activity-deadlines/:deadlineId")
  @UsePipes(new ZodPipe(apiSem010))
  async deleteDeadline(
    @Param() param: ApiSem010RequestParam,
  ): Promise<ApiSem010ResponseOK> {
    return this.activityDurationService.deleteActivityDeadline({ param });
  }

  // ActivityDuration CRUD endpoints
  @Executive()
  @Post("/executive/semesters/activity-durations")
  @UsePipes(new ZodPipe(apiSem011))
  async createActivityDuration(
    @GetExecutive() executive: GetExecutive,
    @Query() _query: ApiSem011RequestQuery,
    @Body() _body: ApiSem011RequestBody,
  ): Promise<ApiSem011ResponseNotImplemented> {
    logger.info(
      `User executive_id: ${executive.id} trying to call unimplemented feature`,
    );
    throw new NotImplementedException();
  }

  @Executive()
  @Get("/executive/semesters/activity-durations")
  @UsePipes(new ZodPipe(apiSem012))
  async getActivityDurations(
    @Query() query: ApiSem012RequestQuery,
  ): Promise<ApiSem012ResponseOK> {
    return this.activityDurationService.getActivityDurations({ query });
  }

  @Executive()
  @Put("/executive/semesters/activity-durations/:activityDurationId")
  @UsePipes(new ZodPipe(apiSem013))
  async updateActivityDuration(
    @GetExecutive() executive: GetExecutive,
    @Param() _param: ApiSem013RequestParam,
    @Body() _body: ApiSem013RequestBody,
  ): Promise<ApiSem013ResponseNotImplemented> {
    logger.info(
      `User executive_id: ${executive.id} trying to call unimplemented feature`,
    );
    throw new NotImplementedException();
  }

  @Executive()
  @Delete("/executive/semesters/activity-durations/:activityDurationId")
  @UsePipes(new ZodPipe(apiSem014))
  async deleteActivityDuration(
    @GetExecutive() executive: GetExecutive,
    @Param() _param: ApiSem014RequestParam,
  ): Promise<ApiSem014ResponseNotImplemented> {
    logger.info(
      `User executive_id: ${executive.id} trying to call unimplemented feature`,
    );
    throw new NotImplementedException();
  }
}
