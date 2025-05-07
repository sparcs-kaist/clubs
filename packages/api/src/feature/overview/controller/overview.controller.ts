import { Controller, Get, Query, UsePipes } from "@nestjs/common";

import apiOvv001, {
  ApiOvv001RequestQuery,
  ApiOvv001ResponseOK,
} from "@clubs/interface/api/overview/endpoint/apiOvv001";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Public } from "@sparcs-clubs/api/common/util/decorators/method-decorator";

import { OverviewService } from "../service/overview.service";

@Controller()
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Public()
  @Get("/overview/delegates")
  @UsePipes(new ZodPipe(apiOvv001))
  async getDelegateOverveiw(
    @Query() query: ApiOvv001RequestQuery,
  ): Promise<ApiOvv001ResponseOK> {
    return this.overviewService.getDelegateOverview(query);
  }

  // @Public()
  // @Get("/overview/clubinfokr")
  // async getClubInfoOverview(): Promise<unknown[]> {
  //   return this.overviewService.getClubsInfoOverview();
  // }
}
