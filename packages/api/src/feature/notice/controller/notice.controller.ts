import { Controller, Get, Query, UsePipes } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import type {
  ApiNtc001RequestQuery,
  ApiNtc001ResponseOK,
} from "@clubs/interface/api/notice/endpoint/apiNtc001";
import apiNtc001 from "@clubs/interface/api/notice/endpoint/apiNtc001";
import type {
  ApiNtc002RequestQuery,
  ApiNtc002ResponseOK,
} from "@clubs/interface/api/notice/endpoint/apiNtc002";
import apiNtc002 from "@clubs/interface/api/notice/endpoint/apiNtc002";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Public } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import logger from "@sparcs-clubs/api/common/util/logger";
import { NoticeService } from "@sparcs-clubs/api/feature/notice/service/notice.service";

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

  @Public()
  @Get("/notices/lastupdatetime")
  @UsePipes(new ZodPipe(apiNtc002))
  async getLastUpdateTime(
    @Query() query: ApiNtc002RequestQuery,
  ): Promise<ApiNtc002ResponseOK> {
    const notices = await this.noticesService.getLastUpdateTime(
      query.pageOffset,
      query.itemCount,
    );
    return notices;
  }

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: "crawlNotices",
    timeZone: "Asia/Seoul",
  })
  async updateRecentNotices(): Promise<void> {
    const crawlRange = new Date().getMinutes() % 10 > 5;
    await this.noticesService.updateNotices(crawlRange ? 3 : Infinity);
  }
}
