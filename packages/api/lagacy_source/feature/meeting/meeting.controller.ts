import { Controller, Get, Query, UsePipes } from "@nestjs/common";

import apiMee005, {
  ApiMee005RequestQuery,
  ApiMee005ResponseOk,
} from "@clubs/interface/api/meeting/apiMee005";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { MeetingService } from "./meeting.service";

@Controller()
export default class MeetingController {
  constructor(private meetingService: MeetingService) {}

  @Executive()
  @Get("executive/meetings/meeting/next-degree")
  @UsePipes(new ZodPipe(apiMee005))
  async getMeetingNextDegree(
    @GetExecutive() user: GetExecutive,
    @Query() query: ApiMee005RequestQuery,
  ): Promise<ApiMee005ResponseOk> {
    const degree = await this.meetingService.getExecutiveMeetingNextDegree(
      query,
      user.executiveId,
    );

    return { degree };
  }
}
