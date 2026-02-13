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
  ApiSem011ResponseCreated,
  ApiSem012RequestQuery,
  ApiSem012ResponseOK,
  ApiSem013RequestBody,
  ApiSem013RequestParam,
  ApiSem013ResponseNotImplemented,
  ApiSem014RequestParam,
  ApiSem014ResponseOk,
  ApiSem015RequestBody,
  ApiSem015ResponseCreated,
  ApiSem016RequestQuery,
  ApiSem016ResponseOk,
  ApiSem017RequestParam,
  ApiSem017ResponseOk,
  ApiSem018RequestBody,
  ApiSem018ResponseCreated,
  ApiSem019RequestQuery,
  ApiSem019ResponseOk,
  ApiSem020RequestParam,
  ApiSem020ResponseOk,
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
  apiSem015,
  apiSem016,
  apiSem017,
  apiSem018,
  apiSem019,
  apiSem020,
} from "@clubs/interface/api/semester/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";
import logger from "@sparcs-clubs/api/common/util/logger";

import { ActivityDurationService } from "../service/activity-duration.service";
import { FundingDeadlineService } from "../service/funding-deadline.service";
import { RegistrationDeadlineService } from "../service/registration-deadline.service";

@Controller()
export class ActivityDurationController {
  constructor(
    private readonly activityDurationService: ActivityDurationService,
    private readonly fundingDeadlineService: FundingDeadlineService,
    private readonly registrationDeadlineService: RegistrationDeadlineService,
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
    @Body() body: ApiSem011RequestBody,
  ): Promise<ApiSem011ResponseCreated> {
    return this.activityDurationService.createActivityDuration(body);
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
    @Param() param: ApiSem014RequestParam,
  ): Promise<ApiSem014ResponseOk> {
    return this.activityDurationService.deleteActivityDuration(
      param.activityDurationId,
    );
  }

  @Executive()
  @Post("/executive/semesters/funding-deadlines")
  @UsePipes(new ZodPipe(apiSem015))
  async createFundingDeadline(
    @GetExecutive() executive: GetExecutive,
    @Body() body: ApiSem015RequestBody,
  ): Promise<ApiSem015ResponseCreated> {
    return this.fundingDeadlineService.createFundingDeadline(
      executive.id,
      body,
    );
  }

  @Executive()
  @Get("/executive/semesters/funding-deadlines")
  @UsePipes(new ZodPipe(apiSem016))
  async getFundingDeadlines(
    @GetExecutive() executive: GetExecutive,
    @Query() query: ApiSem016RequestQuery,
  ): Promise<ApiSem016ResponseOk> {
    if (!query.activityDId) {
      return this.fundingDeadlineService.getFundingDeadlines(executive.id);
    }
    return this.fundingDeadlineService.getFundingDeadlines(
      executive.id,
      query.activityDId,
    );
  }

  @Executive()
  @Delete("/executive/semesters/funding-deadlines/:fundingDeadlineId")
  @UsePipes(new ZodPipe(apiSem017))
  async deleteFundingDeadline(
    @GetExecutive() executive: GetExecutive,
    @Param() param: ApiSem017RequestParam,
  ): Promise<ApiSem017ResponseOk> {
    return this.fundingDeadlineService.deleteFundingDeadline(
      executive.id,
      param.fundingDeadlineId,
    );
  }

  // Registration Deadline CRUD endpoints
  @Executive()
  @Post("/executive/semesters/registration-deadlines")
  @UsePipes(new ZodPipe(apiSem018))
  async createRegistrationDeadline(
    @GetExecutive() executive: GetExecutive,
    @Body() body: ApiSem018RequestBody,
  ): Promise<ApiSem018ResponseCreated> {
    return this.registrationDeadlineService.createRegistrationDeadline(
      executive.id,
      body,
    );
  }

  @Executive()
  @Get("/executive/semesters/registration-deadlines")
  @UsePipes(new ZodPipe(apiSem019))
  async getRegistrationDeadlines(
    @GetExecutive() executive: GetExecutive,
    @Query() query: ApiSem019RequestQuery,
  ): Promise<ApiSem019ResponseOk> {
    return this.registrationDeadlineService.getRegistrationDeadlines(
      executive.id,
      query.semesterId,
    );
  }

  @Executive()
  @Delete("/executive/semesters/registration-deadlines/:registrationDeadlineId")
  @UsePipes(new ZodPipe(apiSem020))
  async deleteRegistrationDeadline(
    @GetExecutive() executive: GetExecutive,
    @Param() param: ApiSem020RequestParam,
  ): Promise<ApiSem020ResponseOk> {
    return this.registrationDeadlineService.deleteRegistrationDeadline(
      executive.id,
      param.registrationDeadlineId,
    );
  }
}
