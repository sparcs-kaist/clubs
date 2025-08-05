import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from "@nestjs/common";

import apiUsr001 from "@clubs/interface/api/user/endpoint/apiUsr001";
import apiUsr002, {
  ApiUsr002RequestQuery,
  ApiUsr002ResponseOk,
} from "@clubs/interface/api/user/endpoint/apiUsr002";
import apiUsr003, {
  ApiUsr003RequestBody,
} from "@clubs/interface/api/user/endpoint/apiUsr003";
import {
  apiUsr006,
  type ApiUsr006RequestBody,
  type ApiUsr006ResponseCreated,
  apiUsr007,
  type ApiUsr007ResponseOk,
  apiUsr008,
  type ApiUsr008RequestParam,
  type ApiUsr008ResponseOk,
} from "@clubs/interface/api/user/endpoint/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Executive,
  Student,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import {
  GetStudent,
  GetUser,
} from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import UserPublicService from "../service/user.public.service";
import { UserService } from "../service/user.service";

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userPublicService: UserPublicService,
  ) {}

  @Student()
  @Get("/student/user/my")
  @UsePipes(new ZodPipe(apiUsr001))
  async getStudentUserMy(@GetStudent() user: GetStudent) {
    const student = await this.userService.getStudentUserMy(user.studentId);
    return student;
    // return apiUsr001.responseBodyMap[200].parse(student);
  }

  @Get("student")
  async getStudentById(@Query("studentId") query: number) {
    const student = await this.userService.findStudentById(query);
    return student;
  }

  @Get("/user/my/phone")
  @UsePipes(new ZodPipe(apiUsr002))
  async getPhoneNumber(
    @GetUser() user: GetUser,
    @Query() query: ApiUsr002RequestQuery,
  ): Promise<ApiUsr002ResponseOk> {
    let phoneNumber;

    if (
      query.profile === "undergraduate" ||
      query.profile === "master" ||
      query.profile === "doctor"
    ) {
      phoneNumber = await this.userService.getStudentPhoneNumberByUserId(
        user.id,
      );
    } else if (query.profile === "executive") {
      phoneNumber = await this.userService.getExecutivePhoneNumberByUserId(
        user.id,
      );
    } else if (query.profile === "professor") {
      phoneNumber = await this.userService.getProfessorPhoneNumberByUserId(
        user.id,
      );
    }
    // TODO: employee
    if (
      !phoneNumber ||
      phoneNumber.phoneNumber === "" ||
      phoneNumber.phoneNumber === undefined ||
      phoneNumber.phoneNumber === null
    ) {
      phoneNumber = await this.userService.getUserPhoneNumber(user.id);
      if (
        !phoneNumber ||
        phoneNumber.phoneNumber === "" ||
        phoneNumber.phoneNumber === undefined ||
        phoneNumber.phoneNumber === null
      ) {
        return { phoneNumber: null };
      }
      if (
        query.profile === "undergraduate" ||
        query.profile === "master" ||
        query.profile === "doctor"
      ) {
        await this.userPublicService.updateStudentPhoneNumber(
          user.id,
          phoneNumber.phoneNumber,
        );
      } else if (query.profile === "executive") {
        await this.userService.updateExecutivePhoneNumber(
          user.id,
          phoneNumber.phoneNumber,
        );
      } else if (query.profile === "professor") {
        await this.userService.updateProfessorPhoneNumber(
          user.id,
          phoneNumber.phoneNumber,
        );
      }
    }
    return phoneNumber;
  }

  @Patch("/user/my/phone")
  @UsePipes(new ZodPipe(apiUsr003))
  async updatePhoneNumber(
    @GetUser() user: GetUser,
    @Body() body: ApiUsr003RequestBody,
  ) {
    if (
      body.profile === "undergraduate" ||
      body.profile === "master" ||
      body.profile === "doctor"
    ) {
      await this.userPublicService.updateStudentPhoneNumber(
        user.id,
        body.phoneNumber,
      );
    } else if (body.profile === "executive") {
      await this.userService.updateExecutivePhoneNumber(
        user.id,
        body.phoneNumber,
      );
    } else if (body.profile === "professor") {
      await this.userService.updateProfessorPhoneNumber(
        user.id,
        body.phoneNumber,
      );
    }
    await this.userService.updatePhoneNumber(user.id, body.phoneNumber);
    return {};
  }

  @Executive()
  @Post("/executive/user/executives")
  @UsePipes(new ZodPipe(apiUsr006))
  async createExecutive(
    @GetUser() user: GetUser,
    @Body() body: ApiUsr006RequestBody,
  ): Promise<ApiUsr006ResponseCreated> {
    await this.userService.createExecutive(user.id, body);
    return {};
  }

  @Executive()
  @Get("/executive/user/executives")
  @UsePipes(new ZodPipe(apiUsr007))
  async getExecutives(@GetUser() user: GetUser): Promise<ApiUsr007ResponseOk> {
    const executives = await this.userService.getExecutives(user.id);
    return executives;
  }

  @Executive()
  @Delete("/executive/user/executives/:executiveId")
  @UsePipes(new ZodPipe(apiUsr008))
  async deleteExecutive(
    @GetUser() user: GetUser,
    @Param("executiveId") id: ApiUsr008RequestParam["executiveId"],
  ): Promise<ApiUsr008ResponseOk> {
    await this.userService.deleteExecutive(user.id, id);
    return {};
  }
}
