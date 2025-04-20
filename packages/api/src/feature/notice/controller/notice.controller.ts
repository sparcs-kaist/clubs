import { Controller, Get, Query, UsePipes } from "@nestjs/common";

import type {
  ApiNtc001RequestQuery,
  ApiNtc001ResponseOK,
} from "@clubs/interface/api/notice/endpoint/apiNtc001";
import apiNtc001 from "@clubs/interface/api/notice/endpoint/apiNtc001";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Public } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import logger from "@sparcs-clubs/api/common/util/logger";

import { NoticeService } from "../service/notice.service";

@Controller()
export class NoticeController {
  constructor(private readonly noticesService: NoticeService) {}

  @Public()
  @Get("/notices")
  @UsePipes(new ZodPipe(apiNtc001))
  async getNotices(
    @Query() query: ApiNtc001RequestQuery,
  ): Promise<ApiNtc001ResponseOK> {
    logger.debug(
      `[/notices] offset: ${query.pageOffset}, count: ${query.itemCount}`,
    );
    const notices = await this.noticesService.getNotices(
      query.pageOffset,
      query.itemCount,
    );
    return notices;
  }
}
