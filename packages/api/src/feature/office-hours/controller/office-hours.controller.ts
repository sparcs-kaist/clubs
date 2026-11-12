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
  type OfficeDateRange,
  type OfficeHour,
  type OfficeHourInput,
} from "@clubs/interface/api/office-hours";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Executive,
  Public,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { GetExecutive } from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { OfficeHoursPublicService } from "../publicService/office-hours.public.service";
import type { OfficeHourRow } from "../repository/office-hours.repository";
import { OfficeHoursService } from "../service/office-hours.service";

function serializeOfficeHour(row: OfficeHourRow): OfficeHour {
  return {
    ...row,
    opensAt: row.opensAt.toISOString(),
    closesAt: row.closesAt.toISOString(),
  };
}

@Controller()
export class OfficeHoursController {
  constructor(
    private readonly officeHoursPublicService: OfficeHoursPublicService,
    private readonly officeHoursService: OfficeHoursService,
  ) {}

  @Public()
  @Get(apiOfh001.url())
  @UsePipes(new ZodPipe(apiOfh001))
  async getPublic(@Query() query: OfficeDateRange) {
    return this.list(query);
  }

  @Executive()
  @Get(apiOfh002.url())
  @UsePipes(new ZodPipe(apiOfh002))
  async getExecutive(@Query() query: OfficeDateRange) {
    return this.list(query);
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
    return { officeHour: serializeOfficeHour(row) };
  }

  private async list({ from, to }: OfficeDateRange) {
    const rows = await this.officeHoursPublicService.list(from, to);
    return { items: rows.map(serializeOfficeHour) };
  }
}
