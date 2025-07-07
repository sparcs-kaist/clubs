import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from "@nestjs/common";

import apiMee006, {
  ApiMee006RequestBody,
  ApiMee006RequestParam,
  ApiMee006ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee006";
import apiMee007, {
  ApiMee007RequestParam,
  ApiMee007ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee007";
import apiMee008, {
  ApiMee008RequestBody,
  ApiMee008RequestParam,
  ApiMee008ResponseOk,
} from "@clubs/interface/api/meeting/apiMee008";
import apiMee009, {
  ApiMee009RequestBody,
  ApiMee009RequestParam,
  ApiMee009ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee009";
import apiMee010, {
  ApiMee010RequestParam,
  ApiMee010ResponseOk,
} from "@clubs/interface/api/meeting/apiMee010";
import apiMee011, {
  ApiMee011RequestParam,
  ApiMee011ResponseCreated,
} from "@clubs/interface/api/meeting/apiMee011";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { AgendaService } from "./agenda.service";

@Controller()
export default class AgendaController {
  constructor(private meetingService: AgendaService) {}

  @Executive()
  @Post("/executive/meetings/meeting/:meetingId/agendas/agenda")
  @UsePipes(new ZodPipe(apiMee006))
  async postExecutiveMeetingAgenda(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiMee006RequestParam,
    @Body() body: ApiMee006RequestBody,
  ): Promise<ApiMee006ResponseCreated> {
    const result = await this.meetingService.postExecutiveMeetingAgenda(
      user.executiveId,
      param.meetingId,
      body.meetingEnumId,
      body.description,
      body.title,
    );
    return result;
  }

  @Get("/executive/meetings/meeting/:meetingId/agendas")
  @UsePipes(new ZodPipe(apiMee007))
  async getExecutiveMeetingAgendas(
    @Param() param: ApiMee007RequestParam,
  ): Promise<ApiMee007ResponseCreated> {
    const result = await this.meetingService.getMeetingAgendas(param);
    return result;
  }

  @Executive()
  @Patch("/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId")
  @UsePipes(new ZodPipe(apiMee008))
  async patchExecutiveMeetingAgenda(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiMee008RequestParam,
    @Body() body: ApiMee008RequestBody,
  ): Promise<ApiMee008ResponseOk> {
    const result = await this.meetingService.patchExecutiveMeetingAgenda(
      user.executiveId,
      param.agendaId,
      body.agendaEnumId,
      body.description,
      body.title,
    );
    return result;
  }

  @Executive()
  @Patch("/executive/meetings/meeting/:meetingId/agendas")
  @UsePipes(new ZodPipe(apiMee009))
  async patchExecutiveMeetingAgendasOrder(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiMee009RequestParam,
    @Body() body: ApiMee009RequestBody,
  ): Promise<ApiMee009ResponseCreated> {
    const result = await this.meetingService.patchExecutiveMeetingAgendasOrder(
      user.executiveId,
      param,
      body,
    );
    return result;
  }

  @Executive()
  @Delete("/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId")
  @UsePipes(new ZodPipe(apiMee010))
  async deleteExecutiveMeetingAgenda(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiMee010RequestParam,
  ): Promise<ApiMee010ResponseOk> {
    const result = await this.meetingService.deleteExecutiveMeetingAgenda(
      user.executiveId,
      param,
    );
    return result;
  }

  @Executive()
  @Delete("/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId")
  @UsePipes(new ZodPipe(apiMee011))
  async postExecutiveMeetingAgendaImport(
    @GetExecutive() user: GetExecutive,
    @Param() param: ApiMee011RequestParam,
  ): Promise<ApiMee011ResponseCreated> {
    const result = await this.meetingService.postExecutiveMeetingAgendaImport(
      user.executiveId,
      param,
    );
    return result;
  }
}
