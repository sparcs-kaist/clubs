import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UsePipes,
} from "@nestjs/common";
import { Response } from "express";

import apiReg005, {
  ApiReg005RequestBody,
  ApiReg005ResponseCreated,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg005";
import {
  ApiReg006ResponseNoContent,
  ApiReg006ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";
import apiReg007, {
  ApiReg007RequestBody,
  ApiReg007RequestParam,
  ApiReg007ResponseNoContent,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg007";
import apiReg008, {
  ApiReg008RequestParam,
  ApiReg008ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";
import apiReg013, {
  ApiReg013RequestParam,
  ApiReg013ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg013";
import type {
  ApiReg019RequestQuery,
  ApiReg019ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg019";
import apiReg019 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg019";
import type {
  ApiReg020RequestQuery,
  ApiReg020ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg020";
import apiReg020 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg020";
import type {
  ApiReg026RequestParam,
  ApiReg026ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg026";
import apiReg026, {
  ApiReg026RequestUrl,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg026";
import apiReg028, {
  ApiReg028RequestUrl,
  ApiReg028ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg028";

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

import { MemberRegistrationService } from "../service/member-registration.service";

@Controller()
export class MemberRegistrationController {
  constructor(
    private readonly memberRegistrationService: MemberRegistrationService,
  ) {}

  @Student()
  @Post("/student/registrations/member-registrations/member-registration")
  @UsePipes(new ZodPipe(apiReg005))
  async postStudentRegistrationsMemberRegistration(
    @GetStudent() user: GetStudent,
    @Body() body: ApiReg005RequestBody,
  ): Promise<ApiReg005ResponseCreated> {
    const result = await this.memberRegistrationService.postMemberRegistration(
      user.studentId,
      body.clubId,
    );
    return result;
  }

  @Student()
  @Get("/student/registrations/member-registrations/my")
  async getStudentRegistrationsMemberRegistrationsMy(
    @GetStudent() user: GetStudent,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiReg006ResponseOk | ApiReg006ResponseNoContent> {
    const result =
      await this.memberRegistrationService.getMemberRegistrationsMy(
        user.studentId,
      );
    res.status(result.status);
    return result.data;
  }

  @Student()
  @Delete(
    "/student/registrations/member-registrations/member-registration/:applyId",
  )
  @UsePipes(new ZodPipe(apiReg013))
  async deleteStudentRegistrationsMemberRegistration(
    @GetStudent() user: GetStudent,
    @Param() { applyId }: ApiReg013RequestParam,
  ): Promise<ApiReg013ResponseOk> {
    const result =
      await this.memberRegistrationService.deleteMemberRegistration(
        user.studentId,
        applyId,
      );
    return result;
  }

  @Student()
  @Patch(
    "/student/registrations/member-registrations/member-registration/:applyId",
  )
  @HttpCode(204)
  @UsePipes(new ZodPipe(apiReg007))
  async patchStudentRegistrationsMemberRegistration(
    @GetStudent() user: GetStudent,
    @Param() { applyId }: ApiReg007RequestParam,
    @Body() { clubId, applyStatusEnumId }: ApiReg007RequestBody,
  ): Promise<ApiReg007ResponseNoContent> {
    const result = await this.memberRegistrationService.patchMemberRegistration(
      user.studentId,
      applyId,
      clubId,
      applyStatusEnumId,
    );
    return result;
  }

  @Student()
  @Get("/student/registrations/member-registrations/club/:clubId")
  @UsePipes(new ZodPipe(apiReg008))
  async getStudentRegistrationsMemberRegistrationsClub(
    @GetStudent() user: GetStudent,
    @Param() { clubId }: ApiReg008RequestParam,
  ): Promise<ApiReg008ResponseOk> {
    const result =
      await this.memberRegistrationService.getMemberRegistrationsClub(
        user.studentId,
        clubId,
      );
    return result;
  }

  @Executive()
  @Get("/executive/registrations/member-registrations/brief")
  @UsePipes(new ZodPipe(apiReg019))
  async getExecutiveRegistrationsMemberRegistrationsBrief(
    @GetExecutive() user: GetExecutive,
    @Query() query: ApiReg019RequestQuery,
  ): Promise<ApiReg019ResponseOk> {
    const result =
      await this.memberRegistrationService.getExecutiveRegistrationsMemberRegistrationsBrief(
        {
          executiveId: user.executiveId,
          query,
        },
      );
    return result;
  }

  @Executive()
  @Get("/executive/registrations/member-registrations")
  @UsePipes(new ZodPipe(apiReg020))
  async getExecutiveRegistrationsMemberRegistrations(
    @GetExecutive() user: GetExecutive,
    @Query() query: ApiReg020RequestQuery,
  ): Promise<ApiReg020ResponseOk> {
    const result =
      await this.memberRegistrationService.getExecutiveRegistrationsMemberRegistrations(
        {
          executiveId: user.executiveId,
          query,
        },
      );

    return result;
  }

  @Public()
  @Get(ApiReg026RequestUrl)
  @UsePipes(new ZodPipe(apiReg026))
  async getClubMemberRegistrationCount(
    @Param() { clubId }: ApiReg026RequestParam,
  ): Promise<ApiReg026ResponseOk> {
    const result =
      await this.memberRegistrationService.getClubMemberRegistrationCount(
        clubId,
      );
    return result;
  }

  @Public()
  @Get(ApiReg028RequestUrl)
  @UsePipes(new ZodPipe(apiReg028))
  async getMemberRegistrationDeadline(): Promise<ApiReg028ResponseOk> {
    const result =
      await this.memberRegistrationService.getMemberRegistrationDeadline();
    return result;
  }
}
