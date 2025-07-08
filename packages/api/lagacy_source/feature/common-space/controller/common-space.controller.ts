import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
} from "@nestjs/common";

import type { ApiCms001ResponseOK } from "@clubs/interface/api/common-space/endpoint/apiCms001";
import type {
  ApiCms002RequestParam,
  ApiCms002RequestQuery,
  ApiCms002ResponseOK,
} from "@clubs/interface/api/common-space/endpoint/apiCms002";
import apiCms002 from "@clubs/interface/api/common-space/endpoint/apiCms002";
import type {
  ApiCms003RequestBody,
  ApiCms003RequestParam,
  ApiCms003ResponseCreated,
} from "@clubs/interface/api/common-space/endpoint/apiCms003";
import apiCms003 from "@clubs/interface/api/common-space/endpoint/apiCms003";
import type {
  ApiCms004RequestParam,
  ApiCms004ResponseOK,
} from "@clubs/interface/api/common-space/endpoint/apiCms004";
import apiCms004 from "@clubs/interface/api/common-space/endpoint/apiCms004";
import type {
  ApiCms005RequestBody,
  ApiCms005RequestParam,
  ApiCms005ResponseCreated,
} from "@clubs/interface/api/common-space/endpoint/apiCms005";
import apiCms005 from "@clubs/interface/api/common-space/endpoint/apiCms005";
import type {
  ApiCms006RequestQuery,
  ApiCms006ResponseOk,
} from "@clubs/interface/api/common-space/endpoint/apiCms006";
import apiCms006 from "@clubs/interface/api/common-space/endpoint/apiCms006";
import type {
  ApiCms007RequestQuery,
  ApiCms007ResponseOk,
} from "@clubs/interface/api/common-space/endpoint/apiCms007";
import apiCms007 from "@clubs/interface/api/common-space/endpoint/apiCms007";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Public,
  Student,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetStudent } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { CommonSpaceService } from "../service/common-space.service";

@Controller()
export class CommonSpaceController {
  constructor(private readonly commonspaceService: CommonSpaceService) {}

  @Public()
  @Get("common-spaces")
  async getCommonSpaces(): Promise<ApiCms001ResponseOK> {
    const result = await this.commonspaceService.getCommonSpaces();
    return result;
  }

  @Public()
  @Get("common-spaces/common-space/:spaceId/orders")
  @UsePipes(new ZodPipe(apiCms002))
  async getCommonSpaceUsageOrder(
    @Param() param: ApiCms002RequestParam,
    @Query() query: ApiCms002RequestQuery,
  ): Promise<ApiCms002ResponseOK> {
    const result = await this.commonspaceService.getCommonSpaceUsageOrder(
      param.spaceId,
      query.startDate,
      query.endTerm,
    );
    return result;
  }

  @Student()
  @Post("student/common-spaces/common-space/:spaceId/orders/order")
  @UsePipes(new ZodPipe(apiCms003))
  async postStudentCommonSpaceUsageOrder(
    @GetStudent() user: GetStudent,
    @Param() param: ApiCms003RequestParam,
    @Body() body: ApiCms003RequestBody,
  ): Promise<ApiCms003ResponseCreated> {
    const result =
      await this.commonspaceService.postStudentCommonSpaceUsageOrder(
        param.spaceId,
        body.clubId,
        user.studentId,
        body.startTerm,
        body.endTerm,
      );
    return result;
  }

  @Student()
  @Delete("student/common-spaces/common-space/:spaceId/orders/order/:orderId")
  @UsePipes(new ZodPipe(apiCms004))
  async deleteStudentCommonSpaceUsageOrder(
    @GetStudent() user: GetStudent,
    @Param() param: ApiCms004RequestParam,
  ): Promise<ApiCms004ResponseOK> {
    const result =
      await this.commonspaceService.deleteStudentCommonSpaceUsageOrder(
        param.spaceId,
        param.orderId,
        user.studentId,
      );
    return result;
  }

  @Student()
  @Post("executive/common-spaces/common-space/:spaceId/orders")
  @UsePipes(new ZodPipe(apiCms005))
  async postExecutiveCommonSpaecUsageOrder(
    @GetStudent() user: GetStudent,
    @Param() param: ApiCms005RequestParam,
    @Body() body: ApiCms005RequestBody,
  ): Promise<ApiCms005ResponseCreated> {
    // 정기신청의 경우 사전에 미리 예약된 내역이 없고, 신청 과정에서 사용 가능한 시간에 대한 확인이 필요없다고 가정함.
    const result =
      await this.commonspaceService.postExecutiveCommonSpaecUsageOrder(
        param.spaceId,
        body.clubId,
        user.studentId,
        body.startTime,
        body.endTime,
      );
    return result;
  }

  @Student()
  @Get("student/common-spaces/orders")
  @UsePipes(new ZodPipe(apiCms006))
  async getStudentCommonSpacesUsageOrder(
    @GetStudent() user: GetStudent,
    @Query() query: ApiCms006RequestQuery,
  ): Promise<ApiCms006ResponseOk> {
    const result =
      await this.commonspaceService.getStudentCommonSpacesUsageOrder(
        user.studentId,
        query.clubId,
        query.startDate,
        query.endTerm,
        query.pageOffset,
        query.itemCount,
      );
    return result;
  }

  @Student()
  @Get("student/common-spaces/orders/my")
  @UsePipes(new ZodPipe(apiCms007))
  async getStudentCommonSpacesUsageOrderMy(
    @GetStudent() user: GetStudent,
    @Query() query: ApiCms007RequestQuery,
  ): Promise<ApiCms007ResponseOk> {
    const result =
      await this.commonspaceService.getStudentCommonSpacesUsageOrderMy(
        user.studentId,
        query.startDate,
        query.endTerm,
        query.pageOffset,
        query.itemCount,
      );
    return result;
  }
}
