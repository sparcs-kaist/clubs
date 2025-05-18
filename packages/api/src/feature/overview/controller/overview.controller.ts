import { Controller, Get, Query, UsePipes } from "@nestjs/common";

import apiOvv001, {
  ApiOvv001RequestQuery,
  ApiOvv001ResponseOK,
} from "@clubs/interface/api/overview/endpoint/apiOvv001";
import apiOvv002, {
  ApiOvv002RequestQuery,
  ApiOvv002ResponseOK,
} from "@clubs/interface/api/overview/endpoint/apiOvv002";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { OverviewService } from "@sparcs-clubs/api/feature/overview/service/overview.service";

@Controller()
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Executive()
  @Get("/overview/delegates")
  @UsePipes(new ZodPipe(apiOvv001))
  async getDelegateOverveiw(
    @Query() query: ApiOvv001RequestQuery,
  ): Promise<ApiOvv001ResponseOK> {
    return this.overviewService.getDelegateOverview(query);
  }

  @Executive()
  @Get("/overview/clubinfo/kr")
  @UsePipes(new ZodPipe(apiOvv002))
  async getClubInfoOverview(
    @Query() query: ApiOvv002RequestQuery,
  ): Promise<ApiOvv002ResponseOK> {
    return this.overviewService.getClubsOverview(query);
  }
}
