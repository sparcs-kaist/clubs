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

import apiFnd002, {
  type ApiFnd002RequestParam,
  type ApiFnd002ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd002";
import apiFnd003, {
  type ApiFnd003RequestBody,
  type ApiFnd003RequestParam,
  type ApiFnd003ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd003";
import apiFnd004, {
  type ApiFnd004RequestParam,
  type ApiFnd004ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd004";
import apiFnd005, {
  type ApiFnd005RequestQuery,
  type ApiFnd005ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd005";
import apiFnd006, {
  type ApiFnd006RequestParam,
  type ApiFnd006RequestQuery,
  type ApiFnd006ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd006";
import apiFnd007, {
  type ApiFnd007ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd007";
import apiFnd008, {
  ApiFnd008RequestUrl,
  type ApiFnd008ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd008";
import apiFnd009, {
  type ApiFnd009RequestParam,
  type ApiFnd009RequestQuery,
  ApiFnd009RequestUrl,
  type ApiFnd009ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd009";
import apiFnd010, {
  type ApiFnd010RequestParam,
  ApiFnd010RequestUrl,
  type ApiFnd010ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd010";
import apiFnd012, {
  type ApiFnd012RequestParam,
  ApiFnd012RequestUrl,
  type ApiFnd012ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd012";
import apiFnd013, {
  type ApiFnd013RequestBody,
  type ApiFnd013RequestParam,
  ApiFnd013RequestUrl,
  type ApiFnd013ResponseCreated,
} from "@clubs/interface/api/funding/endpoint/apiFnd013";
import apiFnd014, {
  type ApiFnd014RequestBody,
  ApiFnd014RequestUrl,
  type ApiFnd014ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd014";
import apiFnd015, {
  type ApiFnd015RequestBody,
  ApiFnd015RequestUrl,
  type ApiFnd015ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd015";
import apiFnd016, {
  type ApiFnd016RequestQuery,
  ApiFnd016RequestUrl,
  type ApiFnd016ResponseOk,
} from "@clubs/interface/api/funding/endpoint/apiFnd016";
import {
  apiFnd001,
  type ApiFnd001RequestBody,
  type ApiFnd001ResponseCreated,
} from "@clubs/interface/api/funding/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Executive,
  Public,
  Student,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import {
  GetExecutive,
  GetStudent,
} from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import FundingService from "../service/funding.service";

@Controller()
export default class FundingController {
  constructor(private fundingService: FundingService) {}

  @Student()
  @Post("student/fundings/funding")
  @UsePipes(new ZodPipe(apiFnd001))
  async createStudentFunding(
    @GetStudent() user: GetStudent,
    @Body() body: ApiFnd001RequestBody,
  ): Promise<ApiFnd001ResponseCreated> {
    await this.fundingService.postStudentFunding(body, user.studentId);
    return {};
  }

  @Student()
  @Get("student/fundings/funding/:id")
  @UsePipes(new ZodPipe(apiFnd002))
  async getStudentFunding(
    @GetStudent() user: GetStudent,
    @Param() param: ApiFnd002RequestParam,
  ): Promise<ApiFnd002ResponseOk> {
    const result = await this.fundingService.getStudentFunding2(
      user.studentId,
      param.id,
    );
    return result;
  }

  @Student()
  @Put("student/fundings/funding/:id")
  @UsePipes(new ZodPipe(apiFnd003))
  async putStudentFunding(
    @GetStudent() user: GetStudent,
    @Param() param: ApiFnd003RequestParam,
    @Body() body: ApiFnd003RequestBody,
  ): Promise<ApiFnd003ResponseOk> {
    await this.fundingService.putStudentFunding(body, param, user.studentId);
    return {};
  }

  @Student()
  @Delete("student/fundings/funding/:id")
  @UsePipes(new ZodPipe(apiFnd004))
  async deleteStudentFunding(
    @GetStudent() user: GetStudent,
    @Param() param: ApiFnd004RequestParam,
  ): Promise<ApiFnd004ResponseOk> {
    await this.fundingService.deleteStudentFunding(user.studentId, param);
    return {};
  }

  @Student()
  @Get("student/fundings")
  @UsePipes(new ZodPipe(apiFnd005))
  async getStudentFundings(
    @GetStudent() user: GetStudent,
    @Query() query: ApiFnd005RequestQuery,
  ): Promise<ApiFnd005ResponseOk> {
    return this.fundingService.getStudentFundings(user.studentId, query);
  }

  @Student()
  @Get("student/fundings/activity-durations/activity-duration/:activityDId")
  @UsePipes(new ZodPipe(apiFnd006))
  async getStudentFundingActivityDuration(
    @GetStudent() user: GetStudent,
    @Param() param: ApiFnd006RequestParam,
    @Query() query: ApiFnd006RequestQuery,
  ): Promise<ApiFnd006ResponseOk> {
    return this.fundingService.getStudentFundingActivityDuration(
      user.studentId,
      param,
      query,
    );
  }

  @Public()
  @Get("/public/fundings/deadline")
  @UsePipes(new ZodPipe(apiFnd007))
  async getPublicFundingsDeadline(): Promise<ApiFnd007ResponseOk> {
    return this.fundingService.getPublicFundingsDeadline();
  }

  @Executive()
  @Get(ApiFnd012RequestUrl)
  @UsePipes(new ZodPipe(apiFnd012))
  async getExecutiveFunding(
    @GetExecutive() executive: GetExecutive,
    @Param() param: ApiFnd012RequestParam,
  ): Promise<ApiFnd012ResponseOk> {
    return this.fundingService.getExecutiveFunding(
      executive.executiveId,
      param.id,
    );
  }

  @Executive()
  @Post(ApiFnd013RequestUrl)
  @UsePipes(new ZodPipe(apiFnd013))
  async postExecutiveFundingComment(
    @GetExecutive() executive: GetExecutive,
    @Param() param: ApiFnd013RequestParam,
    @Body() body: ApiFnd013RequestBody,
  ): Promise<ApiFnd013ResponseCreated> {
    return this.fundingService.postExecutiveFundingComment(
      executive.executiveId,
      param.id,
      body.fundingStatusEnum,
      body.approvedAmount,
      body.content,
    );
  }

  @Executive()
  @Get(ApiFnd008RequestUrl)
  @UsePipes(new ZodPipe(apiFnd008))
  async getExecutiveFundings(
    @GetExecutive() executive: GetExecutive,
  ): Promise<ApiFnd008ResponseOk> {
    return this.fundingService.getExecutiveFundings(executive.executiveId);
  }

  @Executive()
  @Get(ApiFnd009RequestUrl)
  @UsePipes(new ZodPipe(apiFnd009))
  async getExecutiveFundingsClubBrief(
    @GetExecutive() executive: GetExecutive,
    @Param() param: ApiFnd009RequestParam,
    @Query() query: ApiFnd009RequestQuery,
  ): Promise<ApiFnd009ResponseOk> {
    return this.fundingService.getExecutiveFundingsClubBrief(
      executive.executiveId,
      param,
      query,
    );
  }

  @Executive()
  @Get(ApiFnd010RequestUrl)
  @UsePipes(new ZodPipe(apiFnd010))
  async getExecutiveFundingsExecutiveBrief(
    @GetExecutive() executive: GetExecutive,
    @Param() param: ApiFnd010RequestParam,
  ): Promise<ApiFnd010ResponseOk> {
    return this.fundingService.getExecutiveFundingsExecutiveBrief(
      executive.executiveId,
      param,
    );
  }

  @Executive()
  @Patch(ApiFnd014RequestUrl)
  @UsePipes(new ZodPipe(apiFnd014))
  async patchExecutiveFundingsChargedExecutive(
    @GetExecutive() executive: GetExecutive,
    @Body() body: ApiFnd014RequestBody,
  ): Promise<ApiFnd014ResponseOk> {
    return this.fundingService.patchExecutiveFundingsChargedExecutive(
      executive.executiveId,
      body,
    );
  }

  @Executive()
  @Patch(ApiFnd015RequestUrl)
  @UsePipes(new ZodPipe(apiFnd015))
  async patchExecutiveFundingsClubChargedExecutive(
    @GetExecutive() executive: GetExecutive,
    @Body() body: ApiFnd015RequestBody,
  ): Promise<ApiFnd015ResponseOk> {
    return this.fundingService.patchExecutiveFundingsClubsChargedExecutive(
      executive.executiveId,
      body,
    );
  }

  // TODO: club이 하나만 오면 zod Error가 나는 버그 있음
  // 이 API 뿐만 아니라, number array를 query param으로 받는 API 전부에 영향이 있음
  // zod 단에서 수정 필요
  @Executive()
  @Get(ApiFnd016RequestUrl)
  @UsePipes(new ZodPipe(apiFnd016))
  async getExecutiveFundingsClubExecutives(
    @GetExecutive() executive: GetExecutive,
    @Query() query: ApiFnd016RequestQuery,
  ): Promise<ApiFnd016ResponseOk> {
    return this.fundingService.getExecutiveFundingsClubExecutives(
      executive.executiveId,
      query,
    );
  }
}
