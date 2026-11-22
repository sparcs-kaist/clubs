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

import apiUsr001 from "@clubs/interface/api/user/endpoint/apiUsr001";
import apiUsr002, {
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
  apiUsr009,
  type ApiUsr009RequestBody,
  type ApiUsr009RequestParam,
  type ApiUsr009ResponseOk,
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
  async getPhoneNumber(@GetUser() user: GetUser): Promise<ApiUsr002ResponseOk> {
    return this.userService.getUserPhoneNumber(user.id);
  }

  @Patch("/user/my/phone")
  @UsePipes(new ZodPipe(apiUsr003))
  async updatePhoneNumber(
    @GetUser() user: GetUser,
    @Body() body: ApiUsr003RequestBody,
  ) {
    await this.userPublicService.updatePhoneNumber(user.id, body.phoneNumber);
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
    return { executives };
  }

  @Executive()
  @Delete("/executive/user/executives/:executiveId")
  @UsePipes(new ZodPipe(apiUsr008))
  async deleteExecutive(
    @GetUser() user: GetUser,
    @Param() param: ApiUsr008RequestParam,
  ): Promise<ApiUsr008ResponseOk> {
    await this.userService.deleteExecutive(user.id, param.executiveId);
    return {};
  }

  @Executive()
  @Put("/executive/user/executives/:executiveTId")
  @UsePipes(new ZodPipe(apiUsr009))
  async updateExecutiveTerm(
    @GetUser() user: GetUser,
    @Param() param: ApiUsr009RequestParam,
    @Body() body: ApiUsr009RequestBody,
  ): Promise<ApiUsr009ResponseOk> {
    await this.userService.updateExecutiveTerm(user.id, param, body);
    return {};
  }
}
