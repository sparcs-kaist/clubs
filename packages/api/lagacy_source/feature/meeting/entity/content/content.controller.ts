import {
  Body,
  Controller,
  Delete,
  // Get,
  Param,
  Post,
  Put,
  UsePipes,
} from "@nestjs/common";

import apiMee013, {
  ApiMee013RequestBody,
  ApiMee013RequestParam,
  ApiMee013ResponseOk,
} from "@clubs/interface/api/meeting/apiMee013";
import apiMee014, {
  ApiMee014RequestBody,
  ApiMee014RequestParam,
  ApiMee014ResponseOk,
} from "@clubs/interface/api/meeting/apiMee014";
import apiMee015, {
  ApiMee015RequestParam,
  ApiMee015ResponseOk,
} from "@clubs/interface/api/meeting/apiMee015";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { ContentService } from "./content.service";

@Controller()
export default class ContentController {
  constructor(private contentService: ContentService) {}

  @Executive()
  @Post(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/contents/content",
  )
  @UsePipes(new ZodPipe(apiMee013))
  async postExecutiveMeetingAgendaContent(
    @GetExecutive() user: GetExecutive,
    @Param() { meetingId, agendaId }: ApiMee013RequestParam,
    @Body() { content }: ApiMee013RequestBody,
  ): Promise<ApiMee013ResponseOk> {
    const result = await this.contentService.postExecutiveMeetingAgendaContent(
      user.executiveId,
      meetingId,
      agendaId,
      content,
    );

    return result;
  }

  @Executive()
  @Put(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/contents/content/:contentId",
  )
  @UsePipes(new ZodPipe(apiMee014))
  async patchExecutiveMeetingAgendaContent(
    @GetExecutive() user: GetExecutive,
    @Param() { meetingId, agendaId, contentId }: ApiMee014RequestParam,
    @Body() { content }: ApiMee014RequestBody,
  ): Promise<ApiMee014ResponseOk> {
    const result = await this.contentService.putExecutiveMeetingAgendaContent(
      user.executiveId,
      meetingId,
      agendaId,
      contentId,
      content,
    );

    return result;
  }

  @Executive()
  @Delete(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/contents/content/:contentId",
  )
  @UsePipes(new ZodPipe(apiMee015))
  async deleteExecutiveMeetingAgendaContent(
    @GetExecutive() user: GetExecutive,
    @Param() { meetingId, agendaId, contentId }: ApiMee015RequestParam,
  ): Promise<ApiMee015ResponseOk> {
    const result =
      await this.contentService.deleteExecutiveMeetingAgendaContent(
        user.executiveId,
        meetingId,
        agendaId,
        contentId,
      );

    return result;
  }
}
