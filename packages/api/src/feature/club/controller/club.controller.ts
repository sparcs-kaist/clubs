import { Body, Controller, Get, Param, Put, UsePipes } from "@nestjs/common";

import {
  apiClb001,
  type ApiClb001ResponseOK,
  apiClb002,
  type ApiClb002RequestParam,
  type ApiClb002ResponseOK,
  apiClb003,
  type ApiClb003ResponseOK,
  apiClb004,
  type ApiClb004RequestParam,
  type ApiClb004ResponseOK,
  apiClb005,
  type ApiClb005RequestBody,
  type ApiClb005RequestParam,
  type ApiClb005ResponseOk,
  apiClb009,
  type ApiClb009RequestParam,
  type ApiClb009ResponseOk,
  apiClb010,
  type ApiClb010RequestParam,
  type ApiClb010ResponseOk,
  apiClb016,
  type ApiClb016ResponseOk,
} from "@clubs/interface/api/club/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Professor,
  Public,
  Student,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import {
  GetProfessor,
  GetStudent,
} from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { ClubService } from "../service/club.service";

@Controller()
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Public()
  @Get("clubs")
  @UsePipes(new ZodPipe(apiClb001))
  async getClubs(): Promise<ApiClb001ResponseOK> {
    const result = await this.clubService.getClubs();
    // return apiClb001.responseBodyMap[200].parse(result);
    return result;
  }

  @Public()
  @Get("clubs/club/:clubId")
  @UsePipes(new ZodPipe(apiClb002))
  async getClub(
    @Param() param: ApiClb002RequestParam,
  ): Promise<ApiClb002ResponseOK> {
    const clubInfo = await this.clubService.getClub(param);
    // return apiClb002.responseBodyMap[200].parse(clubInfo);
    return clubInfo;
  }

  @Student()
  @Get("student/clubs/my")
  @UsePipes(new ZodPipe(apiClb003))
  async getStudentClubsMy(
    @GetStudent() user: GetStudent,
  ): Promise<ApiClb003ResponseOK> {
    const result = await this.clubService.getStudentClubsMy(user.studentId);
    return result;
  }

  @Student()
  @Get("student/clubs/club/:clubId/brief")
  @UsePipes(new ZodPipe(apiClb004))
  async getStudentClubBrief(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb004RequestParam,
  ): Promise<ApiClb004ResponseOK> {
    const result = await this.clubService.getStudentClubBrief(
      user.studentId,
      param,
    );
    return result;
  }

  @Student()
  @Put("student/clubs/club/:clubId/brief")
  @UsePipes(new ZodPipe(apiClb005))
  async putStudentClubBrief(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb005RequestParam,
    @Body() body: ApiClb005RequestBody,
  ): Promise<ApiClb005ResponseOk> {
    const result = await this.clubService.putStudentClubBrief(
      user.studentId,
      param,
      body,
    );
    return result;
  }

  @Student()
  @Get("/student/clubs/club/:clubId/members/semesters")
  @UsePipes(new ZodPipe(apiClb009))
  async getStudentClubSemesters(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb009RequestParam,
  ): Promise<ApiClb009ResponseOk> {
    const result = await this.clubService.getStudentClubSemesters(
      user.studentId,
      param,
    );
    return result;
  }

  @Student()
  @Get("student/clubs/club/:clubId/members/semesters/semester/:semesterId")
  @UsePipes(new ZodPipe(apiClb010))
  async getStudentClubMembers(
    @GetStudent() user: GetStudent,
    @Param() param: ApiClb010RequestParam,
  ): Promise<ApiClb010ResponseOk> {
    const result = await this.clubService.getStudentClubMembers(
      user.studentId,
      param,
    );
    return result;
  }

  @Professor()
  @Get("professor/clubs/my")
  @UsePipes(new ZodPipe(apiClb016))
  async getProfessorClubsMy(
    @GetProfessor() user: GetProfessor,
  ): Promise<ApiClb016ResponseOk> {
    const result = await this.clubService.getProfessorClubsMy(user.professorId);
    return result;
  }
}
