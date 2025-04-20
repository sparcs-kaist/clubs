import { Controller, Get, UsePipes } from "@nestjs/common";

import apiDiv001, {
  ApiDiv001ResponseOk,
} from "@clubs/interface/api/division/endpoint/apiDiv001";
import apiDiv002, {
  ApiDiv002RequestUrl,
  ApiDiv002ResponseOk,
} from "@clubs/interface/api/division/endpoint/apiDiv002";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Public } from "@sparcs-clubs/api/common/util/decorators/method-decorator";

import DivisionService from "../service/division.service";

@Controller()
export default class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Public()
  @Get("/divisions")
  @UsePipes(new ZodPipe(apiDiv001))
  async getDivisions(): Promise<ApiDiv001ResponseOk> {
    const divisions = await this.divisionService.getDivisions();

    return divisions;
  }

  @Public()
  @Get(ApiDiv002RequestUrl)
  @UsePipes(new ZodPipe(apiDiv002))
  async getCurrentDivisions(): Promise<ApiDiv002ResponseOk> {
    const divisions = await this.divisionService.getDivisionsCurrent();
    return divisions;
  }
}
