import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  // Patch,
  Post,
  Put,
  UsePipes,
} from "@nestjs/common";

import apiMee016, {
  ApiMee016RequestBody,
  ApiMee016RequestParam,
  ApiMee016ResponseOk,
} from "@clubs/interface/api/meeting/apiMee016";
import apiMee017, {
  ApiMee017RequestBody,
  ApiMee017RequestParam,
  ApiMee017ResponseOk,
} from "@clubs/interface/api/meeting/apiMee017";
import apiMee018, {
  ApiMee018RequestBody,
  ApiMee018RequestParam,
  ApiMee018ResponseOk,
} from "@clubs/interface/api/meeting/apiMee018";
import apiMee019, {
  ApiMee019RequestBody,
  ApiMee019RequestParam,
  ApiMee019ResponseOk,
} from "@clubs/interface/api/meeting/apiMee019";
import apiMee020, {
  ApiMee020RequestBody,
  ApiMee020RequestParam,
  ApiMee020ResponseOk,
} from "@clubs/interface/api/meeting/apiMee020";
import apiMee022, {
  ApiMee022RequestParam,
  ApiMee022ResponseOk,
} from "@clubs/interface/api/meeting/apiMee022";
import apiMee023, {
  ApiMee023RequestParam,
  ApiMee023ResponseOk,
} from "@clubs/interface/api/meeting/apiMee023";
import apiMee024, {
  ApiMee024RequestParam,
  ApiMee024ResponseOk,
} from "@clubs/interface/api/meeting/apiMee024";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { VoteService } from "./vote.service";

@Controller()
export default class VoteController {
  constructor(private voteService: VoteService) {}

  @Executive()
  @Post(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/votes/vote",
  )
  @UsePipes(new ZodPipe(apiMee016))
  async postExecutiveMeetingAgendaVote(
    @GetExecutive() executive: GetExecutive,
    @Param() { meetingId, agendaId }: ApiMee016RequestParam,
    @Body() { title, description, choices }: ApiMee016RequestBody,
  ): Promise<ApiMee016ResponseOk> {
    const result = await this.voteService.postExecutiveMeetingAgendaVote(
      executive.executiveId,
      meetingId,
      agendaId,
      title,
      description,
      choices,
    );

    return result;
  }

  @Executive()
  @Post(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/votes/vote/:voteId/results",
  )
  @UsePipes(new ZodPipe(apiMee017))
  async postExecutiveMeetingAgendaVoteResult(
    @GetExecutive() executive: GetExecutive,
    @Param() { meetingId, agendaId, voteId }: ApiMee017RequestParam,
    @Body() { choiceId }: ApiMee017RequestBody,
  ): Promise<ApiMee017ResponseOk> {
    const result = await this.voteService.postExecutiveMeetingAgendaVoteResult(
      executive.executiveId,
      meetingId,
      agendaId,
      voteId,
      choiceId,
    );

    return result;
  }

  @Executive()
  @Put(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/votes/vote/:voteId",
  )
  @UsePipes(new ZodPipe(apiMee018))
  async putExecutiveMeetingAgendaVote(
    @GetExecutive() executive: GetExecutive,
    @Param() { meetingId, agendaId, voteId }: ApiMee018RequestParam,
    @Body() { title, description }: ApiMee018RequestBody,
  ): Promise<ApiMee018ResponseOk> {
    const result = await this.voteService.putExecutiveMeetingAgendaVote(
      executive.executiveId,
      meetingId,
      agendaId,
      voteId,
      title,
      description,
    );

    return result;
  }

  @Executive()
  @Put(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/votes/vote/:voteId/choices",
  )
  @UsePipes(new ZodPipe(apiMee019))
  async putExecutiveMeetingAgendaVoteChoices(
    @GetExecutive() executive: GetExecutive,
    @Param() { meetingId, agendaId, voteId }: ApiMee019RequestParam,
    @Body() { choices }: ApiMee019RequestBody,
  ): Promise<ApiMee019ResponseOk> {
    const result = await this.voteService.putExecutiveMeetingAgendaVoteChoices(
      executive.executiveId,
      meetingId,
      agendaId,
      voteId,
      choices,
    );

    return result;
  }

  @Executive()
  @Put(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/votes/vote/:voteId/choice",
  )
  @UsePipes(new ZodPipe(apiMee020))
  async putExecutiveMeetingAgendaVoteUserChoice(
    @GetExecutive() executive: GetExecutive,
    @Param() { meetingId, agendaId, voteId }: ApiMee020RequestParam,
    @Body() { choiceId }: ApiMee020RequestBody,
  ): Promise<ApiMee020ResponseOk> {
    const result =
      await this.voteService.putExecutiveMeetingAgendaVoteUserChoice(
        executive.executiveId,
        meetingId,
        agendaId,
        voteId,
        choiceId,
      );

    return result;
  }

  @Executive()
  @Delete(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/votes/vote/:voteId",
  )
  @UsePipes(new ZodPipe(apiMee022))
  async deleteExecutiveMeetingAgendaVote(
    @GetExecutive() executive: GetExecutive,
    @Param() { meetingId, agendaId, voteId }: ApiMee022RequestParam,
  ): Promise<ApiMee022ResponseOk> {
    const result = await this.voteService.deleteExecutiveMeetingAgendaVote(
      executive.executiveId,
      meetingId,
      agendaId,
      voteId,
    );

    return result;
  }

  @Executive()
  @Delete(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/votes/vote/:voteId/users",
  )
  @UsePipes(new ZodPipe(apiMee023))
  async deleteExecutiveMeetingAgendaVoteForUser(
    @GetExecutive() executive: GetExecutive,
    @Param() { meetingId, agendaId, voteId }: ApiMee023RequestParam,
  ): Promise<ApiMee023ResponseOk> {
    const result =
      await this.voteService.deleteExecutiveMeetingAgendaVoteForUser(
        executive.executiveId,
        meetingId,
        agendaId,
        voteId,
      );

    return result;
  }

  @Executive()
  @Get(
    "/executive/meetings/meeting/:meetingId/agendas/agenda/:agendaId/votes/vote/:voteId",
  )
  @UsePipes(new ZodPipe(apiMee024))
  async getExecutiveMeetingAgendaVote(
    @GetExecutive() executive: GetExecutive,
    @Param() { meetingId, agendaId, voteId }: ApiMee024RequestParam,
  ): Promise<ApiMee024ResponseOk> {
    const result = await this.voteService.getExecutiveMeetingAgendaVote(
      executive.executiveId,
      meetingId,
      agendaId,
      voteId,
    );

    return result;
  }
}
