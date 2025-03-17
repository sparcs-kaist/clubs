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

import { ClubRegistrationService } from "../service/club-registration.service";

@Controller()
export class ClubRegistrationController {
  constructor(
    private readonly clubRegistrationService: ClubRegistrationService,
  ) {}

  @Student()
  @Post("/student/registrations/club-registrations/club-registration")
  @UsePipes(new ZodPipe(apiReg001))
  async postStudentRegistrationClubRegistration(
    @GetStudent() user: GetStudent,
    @Body() body: ApiReg001RequestBody,
  ): Promise<ApiReg001ResponseCreated> {
    const response =
      await this.clubRegistrationService.postStudentRegistrationClubRegistration(
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
      await this.clubRegistrationService.getStudentRegistrationClubRegistrationQualificationRenewal(
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
      await this.clubRegistrationService.getStudentRegistrationClubRegistrationQualificationProvisionalRenewal(
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
      await this.clubRegistrationService.getStudentRegistrationClubRegistrationQualificationPromotional(
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
      await this.clubRegistrationService.putStudentRegistrationsClubRegistration(
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
      await this.clubRegistrationService.deleteStudentRegistrationsClubRegistration(
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
      await this.clubRegistrationService.getStudentRegistrationsClubRegistration(
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
      await this.clubRegistrationService.getStudentRegistrationsClubRegistrationsMy(
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
      await this.clubRegistrationService.getExecutiveRegistrationsClubRegistrations(
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
      await this.clubRegistrationService.getExecutiveRegistrationsClubRegistration(
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
      await this.clubRegistrationService.patchExecutiveRegistrationsClubRegistrationApproval(
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
      await this.clubRegistrationService.postExecutiveRegistrationsClubRegistrationSendBack(
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
      await this.clubRegistrationService.getProfessorRegistrationsClubRegistrationsBrief(
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
      await this.clubRegistrationService.getProfessorRegistrationsClubRegistration(
        { registrationId: param.applyId, professorId: user.professorId },
      );
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
      await this.clubRegistrationService.getProfessorRegistrationsClubRegistrationApproval(
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
      await this.clubRegistrationService.getStudentRegistrationsClubRegistrations(
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
      await this.clubRegistrationService.getStudentRegistrationsAvailableClub(
        student.studentId,
      );
    return result;
  }

  @Public()
  @Get(ApiReg027RequestUrl)
  @UsePipes(new ZodPipe(apiReg027))
  async getClubRegistrationDeadline(): Promise<ApiReg027ResponseOk> {
    const result =
      await this.clubRegistrationService.getClubRegistrationDeadline();
    return result;
  }
}
