import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
} from "@nestjs/common";

import {
  apiOfh001,
  apiOfh002,
  apiOfh003,
  apiOfh004,
  type ExecutiveOfficeHour,
  type OfficeDateRange,
  type OfficeHour,
  type OfficeHourInput,
  type OfficeHourQuery,
} from "@clubs/interface/api/office-hours";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Executive,
  Public,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import type { ExecutiveOfficeHourRow } from "../repository/office-hours.repository";
import { OfficeHoursService } from "../service/office-hours.service";

function serializeOfficeHour(row: ExecutiveOfficeHourRow): OfficeHour {
  return {
    date: row.date,
    isClosed: row.isClosed,
    opensAt: row.opensAt.toISOString(),
    closesAt: row.closesAt.toISOString(),
    publicMemo: row.publicMemo,
  };
}

function serializeExecutiveOfficeHour(
  row: ExecutiveOfficeHourRow,
): ExecutiveOfficeHour {
  return { ...serializeOfficeHour(row), internalMemo: row.internalMemo };
}

@Controller()
export class OfficeHoursController {
  constructor(private readonly officeHoursService: OfficeHoursService) {}

  @Public()
  @Get(apiOfh001.url())
  @UsePipes(new ZodPipe(apiOfh001))
  async getPublic(@Query() query: OfficeHourQuery) {
    const rows = await this.officeHoursService.list(query);
    return { items: rows.map(serializeOfficeHour) };
  }

  @Executive()
  @Get(apiOfh002.url())
  @UsePipes(new ZodPipe(apiOfh002))
  async getExecutive(@Query() query: OfficeHourQuery) {
    const rows = await this.officeHoursService.list(query);
    return { items: rows.map(serializeExecutiveOfficeHour) };
  }

  @Executive()
  @Post(apiOfh003.url())
  @UsePipes(new ZodPipe(apiOfh003))
  async generate(
    @Body() body: OfficeDateRange,
    @GetExecutive() executive: GetExecutive,
  ) {
    return this.officeHoursService.generate(body, executive.executiveId);
  }

  @Executive()
  @Put(apiOfh004.url(":date"))
  @UsePipes(new ZodPipe(apiOfh004))
  async put(
    @Param() { date }: { date: string },
    @Body() body: OfficeHourInput,
    @GetExecutive() executive: GetExecutive,
  ) {
    const row = await this.officeHoursService.put(
      date,
      body,
      executive.executiveId,
    );
    return { officeHour: serializeExecutiveOfficeHour(row) };
  }
}
