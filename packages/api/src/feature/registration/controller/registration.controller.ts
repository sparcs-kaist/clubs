import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UsePipes,
} from "@nestjs/common";
import { Response } from "express";

import apiReg001, {
  ApiReg001RequestBody,
  ApiReg001ResponseCreated,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg001";
import apiReg002, {
  ApiReg002ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg002";
import apiReg003, {
  ApiReg003ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg003";
import apiReg009, {
  ApiReg009RequestBody,
  ApiReg009RequestParam,
  ApiReg009ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg009";
import apiReg010, {
  ApiReg010RequestParam,
  ApiReg010ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg010";
import apiReg011, {
  ApiReg011RequestParam,
  ApiReg011ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg011";
import { ApiReg012ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg012";
import apiReg014, {
  ApiReg014RequestQuery,
  ApiReg014ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg014";
import apiReg015, {
  ApiReg015RequestParam,
  ApiReg015ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg015";
import apiReg016, {
  ApiReg016RequestParam,
  ApiReg016ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg016";
import apiReg017, {
  ApiReg017RequestBody,
  ApiReg017RequestParam,
  ApiReg017ResponseCreated,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg017";
import apiReg018, {
  ApiReg018ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg018";
import type { ApiReg021ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg021";
import type {
  ApiReg022RequestParam,
  ApiReg022ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg022";
import apiReg022 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg022";
import type {
  ApiReg023RequestParam,
  ApiReg023ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg023";
import apiReg023 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg023";
import apiReg024, {
  ApiReg024RequestQuery,
  ApiReg024ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg024";
import apiReg025, {
  ApiReg025RequestUrl,
  ApiReg025ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg025";
import apiReg027, {
  ApiReg027RequestUrl,
  ApiReg027ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg027";
import {
  apiReg005,
  ApiReg005RequestBody,
  ApiReg005ResponseCreated,
  apiReg006,
  ApiReg006ResponseNoContent,
  ApiReg006ResponseOk,
  apiReg007,
  ApiReg007RequestBody,
  ApiReg007RequestParam,
  ApiReg007ResponseNoContent,
  apiReg008,
  ApiReg008RequestParam,
  ApiReg008ResponseOk,
  apiReg013,
  ApiReg013RequestParam,
  ApiReg013ResponseOk,
  apiReg019,
  ApiReg019RequestQuery,
  ApiReg019ResponseOk,
  apiReg020,
  ApiReg020RequestQuery,
  ApiReg020ResponseOk,
  apiReg026,
  ApiReg026RequestParam,
  ApiReg026RequestUrl,
  ApiReg026ResponseOk,
  apiReg028,
  ApiReg028RequestUrl,
  ApiReg028ResponseOk,
} from "@sparcs-clubs/interface/api/registration/index";

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
import logger from "@sparcs-clubs/api/common/util/logger";

import { RegistrationService } from "../service/registration.service";

@Controller()
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Student()
  @Post("/student/registrations/club-registrations/club-registration")
  @UsePipes(new ZodPipe(apiReg001))
  async postStudentRegistrationClubRegistration(
    @GetStudent() user: GetStudent,
    @Body() body: ApiReg001RequestBody,
  ): Promise<ApiReg001ResponseCreated> {
    const response =
      await this.registrationService.postStudentRegistrationClubRegistration(
        user.studentId,
        body,
      );
    return response;
  }

  @Student()
  @Get(
    "/student/registrations/club-registrations/club-registration/qualifications/renewal",
  )
  @UsePipes(new ZodPipe(apiReg002))
  async getStudentRegistrationsClubRegistrationQualificationRenewal(
    @GetStudent() user: GetStudent,
  ): Promise<ApiReg002ResponseOk> {
    const orders =
      await this.registrationService.getStudentRegistrationClubRegistrationQualificationRenewal(
        user.studentId,
      );
    return orders;
  }

  @Student()
  @Get(
    "/student/registrations/club-registrations/club-registration/qualifications/provisional-renewal",
  )
  @UsePipes(new ZodPipe(apiReg018))
  async getStudentRegistrationsClubRegistrationQualificationProvisionalRenewal(
    @GetStudent() user: GetStudent,
  ): Promise<ApiReg018ResponseOk> {
    const orders =
      await this.registrationService.getStudentRegistrationClubRegistrationQualificationProvisionalRenewal(
        user.studentId,
      );
    return orders;
  }

  @Student()
  @Get(
    "/student/registrations/club-registrations/club-registration/qualifications/promotional",
  )
  @UsePipes(new ZodPipe(apiReg003))
  async getStudentRegistrationsClubRegistrationQualificationPromotional(
    @GetStudent() user: GetStudent,
  ): Promise<ApiReg003ResponseOk> {
    const orders =
      await this.registrationService.getStudentRegistrationClubRegistrationQualificationPromotional(
        user.studentId,
      );
    return orders;
  }

  @Student()
  @Put("/student/registrations/club-registrations/club-registration/:applyId")
  @UsePipes(new ZodPipe(apiReg009))
  async putStudentRegistrationsClubRegistration(
    @GetStudent() user: GetStudent,
    @Param() { applyId }: ApiReg009RequestParam,
    @Body() body: ApiReg009RequestBody,
  ): Promise<ApiReg009ResponseOk> {
    const result =
      await this.registrationService.putStudentRegistrationsClubRegistration(
        user.studentId,
        applyId,
        body,
      );
    return result;
  }

  @Student()
  @Delete(
    "/student/registrations/club-registrations/club-registration/:applyId",
  )
  @UsePipes(new ZodPipe(apiReg010))
  async deleteStudentRegistrationsClubRegistration(
    @GetStudent() user: GetStudent,
    @Param() { applyId }: ApiReg010RequestParam,
  ): Promise<ApiReg010ResponseOk> {
    const result =
      await this.registrationService.deleteStudentRegistrationsClubRegistration(
        user.studentId,
        applyId,
      );
    return result;
  }

  @Student()
  @Get("/student/registrations/club-registrations/club-registration/:applyId")
  @UsePipes(new ZodPipe(apiReg011))
  async getStudentRegistrationsClubRegistration(
    @GetStudent() user: GetStudent,
    @Param() { applyId }: ApiReg011RequestParam,
  ): Promise<ApiReg011ResponseOk> {
    const result =
      await this.registrationService.getStudentRegistrationsClubRegistration(
        user.studentId,
        applyId,
      );
    return result;
  }

  @Student()
  @Get("/student/registrations/club-registrations/my")
  async getStudentRegistrationsClubRegistrationsMy(
    @GetStudent() user: GetStudent,
  ): Promise<ApiReg012ResponseOk> {
    const result =
      await this.registrationService.getStudentRegistrationsClubRegistrationsMy(
        user.studentId,
      );
    return result;
  }

  @Executive()
  @Get("/executive/registrations/club-registrations")
  @UsePipes(new ZodPipe(apiReg014))
  async getExecutiveRegistrationsClubRegistrations(
    @GetExecutive() user: GetExecutive,
    @Query() query: ApiReg014RequestQuery,
  ): Promise<ApiReg014ResponseOk> {
    const result =
      await this.registrationService.getExecutiveRegistrationsClubRegistrations(
        query.pageOffset,
        query.itemCount,
      );
    return result;
  }

  @Executive()
  @Get("/executive/registrations/club-registrations/club-registration/:applyId")
  @UsePipes(new ZodPipe(apiReg015))
  async getExecutiveRegistrationsClubRegistration(
    @GetExecutive() user: GetExecutive,
    @Param() { applyId }: ApiReg015RequestParam,
  ): Promise<ApiReg015ResponseOk> {
    const result =
      await this.registrationService.getExecutiveRegistrationsClubRegistration(
        applyId,
      );
    return result;
  }

  @Executive()
  @Patch(
    "/executive/registrations/club-registrations/club-registration/:applyId/approval",
  )
  @UsePipes(new ZodPipe(apiReg016))
  async patchExecutiveRegistrationsClubRegistrationApproval(
    @GetExecutive() user: GetExecutive,
    @Param() { applyId }: ApiReg016RequestParam,
  ): Promise<ApiReg016ResponseOk> {
    const result =
      await this.registrationService.patchExecutiveRegistrationsClubRegistrationApproval(
        applyId,
      );
    return result;
  }

  @Executive()
  @Post(
    "/executive/registrations/club-registrations/club-registration/:applyId/send-back",
  )
  @UsePipes(new ZodPipe(apiReg017))
  async postExecutiveRegistrationsClubRegistrationSendBack(
    @GetExecutive() user: GetExecutive,
    @Param() { applyId }: ApiReg017RequestParam,
    @Body() body: ApiReg017RequestBody,
  ): Promise<ApiReg017ResponseCreated> {
    const result =
      await this.registrationService.postExecutiveRegistrationsClubRegistrationSendBack(
        applyId,
        user.executiveId,
        body.comment,
      );
    return result;
  }

  @Professor()
  @Get("/professor/registrations/club-registrations/brief")
  async getProfessorRegistrationsClubRegistrationsBrief(
    @GetProfessor() user: GetProfessor,
  ): Promise<ApiReg021ResponseOk> {
    logger.debug(
      `[getProfessorRegistrationsClubRegistrationsBrief] log-inned by name: ${user.name} professorId: ${user.id}`,
    );

    const result =
      await this.registrationService.getProfessorRegistrationsClubRegistrationsBrief(
        { professorId: user.professorId },
      );

    return result;
  }

  @Professor()
  @Get("/professor/registrations/club-registrations/club-registration/:applyId")
  @UsePipes(new ZodPipe(apiReg022))
  async getProfessorRegistrationsClubRegistration(
    @Param() param: ApiReg022RequestParam,
    @GetProfessor() user: GetProfessor,
  ): Promise<ApiReg022ResponseOk> {
    logger.debug(
      `[getProfessorRegistrationsClubRegistration] log-inned by name: ${user.name} professorId: ${user.professorId}`,
    );
    const result =
      await this.registrationService.getProfessorRegistrationsClubRegistration({
        registrationId: param.applyId,
        professorId: user.professorId,
      });
    return result;
  }

  @Professor()
  @Patch(
    "/professor/registrations/club-registrations/club-registration/:applyId/approval",
  )
  @UsePipes(new ZodPipe(apiReg023))
  async getProfessorRegistrationsClubRegistrationApproval(
    @GetProfessor() user: GetProfessor,
    @Param() param: ApiReg023RequestParam,
  ): Promise<ApiReg023ResponseOk> {
    const result =
      await this.registrationService.getProfessorRegistrationsClubRegistrationApproval(
        {
          professorId: user.professorId,
          param,
        },
      );
    return result;
  }

  @Student()
  @Get("/student/registrations/club-registrations")
  @UsePipes(new ZodPipe(apiReg024))
  async getStudentRegistrationsClubRegistrations(
    @Query() query: ApiReg024RequestQuery,
  ): Promise<ApiReg024ResponseOk> {
    const result =
      await this.registrationService.getStudentRegistrationsClubRegistrations(
        query.pageOffset,
        query.itemCount,
      );
    return result;
  }

  @Student()
  @Get(ApiReg025RequestUrl)
  @UsePipes(new ZodPipe(apiReg025))
  async getStudentRegistrationsAvailableClub(
    @GetStudent() student: GetStudent,
  ): Promise<ApiReg025ResponseOk> {
    const result =
      await this.registrationService.getStudentRegistrationsAvailableClub(
        student.studentId,
      );
    return result;
  }

  @Public()
  @Get(ApiReg027RequestUrl)
  @UsePipes(new ZodPipe(apiReg027))
  async getClubRegistrationDeadline(): Promise<ApiReg027ResponseOk> {
    const result = await this.registrationService.getClubRegistrationDeadline();
    return result;
  }

  @Student()
  @Post("/student/registrations/member-registrations/member-registration")
  @UsePipes(new ZodPipe(apiReg005))
  async postStudentRegistrationsMemberRegistration(
    @GetStudent() user: GetStudent,
    @Body() body: ApiReg005RequestBody,
  ): Promise<ApiReg005ResponseCreated> {
    const result = await this.registrationService.postMemberRegistration(
      user.studentId,
      body.clubId,
    );
    return result;
  }

  @Student()
  @UsePipes(new ZodPipe(apiReg006))
  @Get("/student/registrations/member-registrations/my")
  async getStudentRegistrationsMemberRegistrationsMy(
    @GetStudent() user: GetStudent,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiReg006ResponseOk | ApiReg006ResponseNoContent> {
    const result = await this.registrationService.getMemberRegistrationsMy(
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
    const result = await this.registrationService.deleteMemberRegistration(
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
    const result = await this.registrationService.patchMemberRegistration(
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
    const result = await this.registrationService.getMemberRegistrationsClub(
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
      await this.registrationService.getExecutiveRegistrationsMemberRegistrationsBrief(
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
      await this.registrationService.getExecutiveRegistrationsMemberRegistrations(
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
      await this.registrationService.getClubMemberRegistrationCount(clubId);
    return result;
  }

  @Public()
  @Get(ApiReg028RequestUrl)
  @UsePipes(new ZodPipe(apiReg028))
  async getMemberRegistrationDeadline(): Promise<ApiReg028ResponseOk> {
    const result =
      await this.registrationService.getMemberRegistrationDeadline();
    return result;
  }
}
