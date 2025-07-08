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

import apiMee001, {
  ApiMee001RequestBody,
  ApiMee001ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee001";
import apiMee002, {
  ApiMee002RequestParam,
  ApiMee002ResponseOk,
} from "@clubs/interface/api/meeting/apiMee002";
import apiMee003, {
  ApiMee003RequestBody,
  ApiMee003RequestParam,
  ApiMee003ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee003";
import apiMee004, {
  ApiMee004RequestParam,
  ApiMee004ResponseOk,
} from "@clubs/interface/api/meeting/apiMee004";
import apiMee012, {
  ApiMee012RequestQuery,
  ApiMee012ResponseOk,
} from "@clubs/interface/api/meeting/apiMee012";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { AnnouncementService } from "./announcement.service";

@Controller()
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  @Executive()
  @Post("/executive/meetings/announcements/announcement")
  @UsePipes(new ZodPipe(apiMee001))
  async createExecutiveMeetingAnnouncement(
    @GetExecutive() user: GetExecutive,
    @Body() body: ApiMee001RequestBody,
  ): Promise<ApiMee001ResponseCreated> {
    const result =
      await this.announcementService.postExecutiveMeetingAnnouncement(
        body,
        user.executiveId,
      );
    return result;
  }

  @Get("/meetings/announcements/announcement/:announcementId")
  @UsePipes(new ZodPipe(apiMee002))
  async getMeetingAnnouncement(
    @Param() param: ApiMee002RequestParam,
  ): Promise<ApiMee002ResponseOk> {
    const result = await this.announcementService.getMeetingAnnouncement(param);
    return result;
  }

  @Executive()
  @Patch("/executive/meetings/announcements/announcement/:announcementId")
  @UsePipes(new ZodPipe(apiMee003))
  async updateExecutiveMeetingAnnouncement(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiMee003RequestParam,
    @Body() body: ApiMee003RequestBody,
  ): Promise<ApiMee003ResponseCreated> {
    await this.announcementService.updateExecutiveMeetingAnnouncement(
      param,
      body,
      user.executiveId,
    );
    return {};
  }

  @Executive()
  @Delete("/executive/meetings/announcements/announcement/:announcementId")
  @UsePipes(new ZodPipe(apiMee004))
  async deleteExecutiveMeetingAnnouncement(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiMee004RequestParam,
  ): Promise<ApiMee004ResponseOk> {
    await this.announcementService.deleteExecutiveMeetingAnnouncement(
      param,
      user.executiveId,
    );
    return {};
  }

  @Get("/meetings/announcements")
  @UsePipes(new ZodPipe(apiMee012))
  async getMeetingAnnouncements(
    @Query() query: ApiMee012RequestQuery,
  ): Promise<ApiMee012ResponseOk> {
    const result =
      await this.announcementService.getMeetingAnnouncements(query);
    return result;
  }
}
