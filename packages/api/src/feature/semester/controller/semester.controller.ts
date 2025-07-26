import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UsePipes,
} from "@nestjs/common";

import apiAct018, {
  type ApiAct018ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct018";
import {
  apiSem001,
  type ApiSem001RequestQuery,
  type ApiSem001ResponseOK,
  apiSem002,
  type ApiSem002RequestBody,
  type ApiSem002ResponseCreated,
  apiSem003,
  type ApiSem003RequestBody,
  type ApiSem003RequestQuery,
  type ApiSem003ResponseOk,
  apiSem004,
  type ApiSem004RequestQuery,
  type ApiSem004ResponseOk,
} from "@clubs/interface/api/semester/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Executive,
  Public,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";

import { SemesterService } from "../service/semester.service";

@Controller()
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Public()
  @Get("/public/semesters")
  @UsePipes(new ZodPipe(apiSem001))
  async getPublicSemesters(
    @Query() query: ApiSem001RequestQuery,
  ): Promise<ApiSem001ResponseOK> {
    return this.semesterService.getPublicSemesters({ query });
  }

  @Executive()
  @Post("/executive/semesters")
  @UsePipes(new ZodPipe(apiSem002))
  async createSemester(
    @Body() body: ApiSem002RequestBody,
  ): Promise<ApiSem002ResponseCreated> {
    return this.semesterService.createSemester({ body });
  }

  @Executive()
  @Put("/executive/semesters")
  @UsePipes(new ZodPipe(apiSem003))
  async updateSemester(
    @Query() query: ApiSem003RequestQuery,
    @Body() body: ApiSem003RequestBody,
  ): Promise<ApiSem003ResponseOk> {
    return this.semesterService.updateSemester({ query, body });
  }

  @Executive()
  @Delete("/executive/semesters")
  @UsePipes(new ZodPipe(apiSem004))
  async deleteSemester(
    @Query() query: ApiSem004RequestQuery,
  ): Promise<ApiSem004ResponseOk> {
    return this.semesterService.deleteSemester({ query });
  }

  @Public()
  @Get("/public/activities/deadline")
  @UsePipes(new ZodPipe(apiAct018))
  async getPublicActivitiesDeadline(): Promise<ApiAct018ResponseOk> {
    const result = await this.semesterService.getPublicActivitiesDeadline();
    return result;
  }
}
