import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Res,
  UsePipes,
} from "@nestjs/common";

import {
  apiClb006,
  type ApiClb006RequestParam,
  type ApiClb006ResponseOK,
  apiClb007,
  type ApiClb007RequestBody,
  type ApiClb007RequestParam,
  type ApiClb007ResponseCreated,
  apiClb008,
  type ApiClb008RequestParam,
  type ApiClb008ResponseOk,
  apiClb011,
  type ApiClb011RequestParam,
  type ApiClb011ResponseOk,
  apiClb012,
  type ApiClb012RequestParam,
  type ApiClb012ResponseCreated,
  apiClb013,
  ApiClb013ResponseOk,
  apiClb014,
  type ApiClb014RequestBody,
  type ApiClb014RequestParam,
  type ApiClb014ResponseCreated,
  apiClb015,
  type ApiClb015ResponseNoContent,
  type ApiClb015ResponseOk,
} from "@clubs/interface/api/club/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Student } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetStudent } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import ClubDelegateService from "./delegate.service";

@Controller()
export default class ClubDelegateController {
  constructor(private clubDelegateService: ClubDelegateService) {}

  @Student()
  @Get("/student/clubs/club/:clubId/delegates")
  @UsePipes(new ZodPipe(apiClb006))
  async getStudentClubDelegates(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb006RequestParam,
  ): Promise<ApiClb006ResponseOK> {
    const result = await this.clubDelegateService.getStudentClubDelegates({
      studentId: user.studentId,
      clubId: param.clubId,
    });

    return result;
  }

  @Student()
  @Put("/student/clubs/club/:clubId/delegates/delegate")
  @UsePipes(new ZodPipe(apiClb007))
  async putStudentClubDelegate(
    @GetStudent() user: GetStudent,
    @Body() body: ApiClb007RequestBody,
    @Param() param: ApiClb007RequestParam,
  ): Promise<ApiClb007ResponseCreated> {
    await this.clubDelegateService.putStudentClubDelegate({
      studentId: user.studentId,
      targetStudentId: body.studentId,
      clubId: param.clubId,
      clubDelegateEnumId: body.delegateEnumId,
    });

    return {};
  }

  @Student()
  @Get(
    "/student/clubs/club/:clubId/delegates/delegate/:delegateEnumId/candidates",
  )
  @UsePipes(new ZodPipe(apiClb008))
  async getStudentClubDelegateCandidates(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb008RequestParam,
  ): Promise<ApiClb008ResponseOk> {
    const result =
      await this.clubDelegateService.getStudentClubDelegateCandidates({
        studentId: user.studentId,
        param,
      });

    return result;
  }

  @Student()
  @Get("/student/clubs/club/:clubId/delegates/delegate/requests")
  @UsePipes(new ZodPipe(apiClb011))
  async getStudentClubDelegateRequests(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb011RequestParam,
  ): Promise<ApiClb011ResponseOk> {
    const result =
      await this.clubDelegateService.getStudentClubDelegateRequests({
        studentId: user.studentId,
        param,
      });

    return result;
  }

  @Student()
  @Delete("/student/clubs/club/:clubId/delegates/delegate/requests")
  @UsePipes(new ZodPipe(apiClb012))
  async deleteStudentClubDelegateRequests(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb012RequestParam,
  ): Promise<ApiClb012ResponseCreated> {
    await this.clubDelegateService.deleteStudentClubDelegateRequests({
      studentId: user.studentId,
      param,
    });

    return {};
  }

  @Student()
  @Get("/student/clubs/delegates/requests")
  @UsePipes(new ZodPipe(apiClb013))
  async getStudentClubsDelegatesRequests(
    @GetStudent() user: GetStudent,
  ): Promise<ApiClb013ResponseOk> {
    const result =
      await this.clubDelegateService.getStudentClubsDelegatesRequests({
        studentId: user.studentId,
      });

    return result;
  }

  @Student()
  @Patch("/student/clubs/delegates/requests/request/:requestId")
  @UsePipes(new ZodPipe(apiClb014))
  async patchStudentClubsDelegatesRequest(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb014RequestParam,
    @Body() body: ApiClb014RequestBody,
  ): Promise<ApiClb014ResponseCreated> {
    await this.clubDelegateService.patchStudentClubsDelegatesRequest({
      studentId: user.studentId,
      param,
      body,
    });

    return {};
  }

  @Student()
  @Get("/student/clubs/delegates/delegate/my")
  @UsePipes(new ZodPipe(apiClb015))
  async getStudentClubDelegate(
    @GetStudent() user: GetStudent,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiClb015ResponseOk | ApiClb015ResponseNoContent> {
    const result = await this.clubDelegateService.getStudentClubDelegate(
      user.studentId,
    );

    res.status(result.status);
    return result.data;
  }
}
