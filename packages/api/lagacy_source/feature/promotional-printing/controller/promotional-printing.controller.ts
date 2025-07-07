import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
} from "@nestjs/common";

import type {
  ApiPrt001RequestQuery,
  ApiPrt001ResponseOk,
} from "@clubs/interface/api/promotional-printing/endpoint/apiPrt001";
import apiPrt001 from "@clubs/interface/api/promotional-printing/endpoint/apiPrt001";
import type {
  ApiPrt002RequestBody,
  ApiPrt002RequestParam,
  ApiPrt002ResponseCreated,
} from "@clubs/interface/api/promotional-printing/endpoint/apiPrt002";
import apiPrt002 from "@clubs/interface/api/promotional-printing/endpoint/apiPrt002";
import type {
  ApiPrt003RequestParam,
  ApiPrt003ResponseOk,
} from "@clubs/interface/api/promotional-printing/endpoint/apiPrt003";
import apiPrt003 from "@clubs/interface/api/promotional-printing/endpoint/apiPrt003";
import type {
  ApiPrt005RequestQuery,
  ApiPrt005ResponseOk,
} from "@clubs/interface/api/promotional-printing/endpoint/apiPrt005";
import apiPrt005 from "@clubs/interface/api/promotional-printing/endpoint/apiPrt005";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { GetStudent } from "@sparcs-clubs/api/common/util/decorators/param-decorator";
import logger from "@sparcs-clubs/api/common/util/logger";

import { PromotionalPrintingService } from "../service/promotional-printing.service";

@Controller()
export class PromotionalPrintingController {
  constructor(
    private readonly promotionalPrintingService: PromotionalPrintingService,
  ) {}

  @Get("/student/promotional-printings/orders")
  async getStudentPromotionalPrintingsOrders(
    @Query("clubId") clubId: ApiPrt001RequestQuery["clubId"],
    @Query("startDate")
    startDate: ApiPrt001RequestQuery["startDate"] | undefined,
    @Query("endTerm") endTerm: ApiPrt001RequestQuery["endTerm"] | undefined,
    @Query("pageOffset") pageOffset: ApiPrt001RequestQuery["pageOffset"],
    @Query("itemCount") itemCount: ApiPrt001RequestQuery["itemCount"],
  ): Promise<ApiPrt001ResponseOk> {
    // TODO: qeury param을 validation해주는 미들웨어?가 아직 없어 수동으로 validation을 수행하고 있습니다.
    // 생기고 나면 교체해줄것
    const query: ApiPrt001RequestQuery = apiPrt001.requestQuery.parse({
      clubId: Number(clubId),
      startDate: startDate === undefined ? undefined : new Date(startDate),
      endTerm: endTerm === undefined ? undefined : new Date(endTerm),
      pageOffset: Number(pageOffset),
      itemCount: Number(itemCount),
    });

    // console.log(
    //   `[/student/promotional-printings/orders] getting promotional priting orders with query ${query}`,
    // );

    const orders =
      await this.promotionalPrintingService.getStudentPromotionalPrintingsOrders(
        query,
      );

    return orders;
  }

  @Post("/student/promotional-printings/orders/order/:clubId")
  @UsePipes(new ZodPipe(apiPrt002))
  async postStudentPromotionalPrintingsOrder(
    @Param() parameter: ApiPrt002RequestParam,
    @Body() body: ApiPrt002RequestBody,
  ): Promise<ApiPrt002ResponseCreated> {
    logger.debug(
      `[/student/promotional-printings/orders/order/:clubId] clubId: ${parameter.clubId}`,
    );

    this.promotionalPrintingService.postStudentPromotionalPrintingsOrder({
      ...parameter,
      ...body,
    });

    return {};
  }

  @Get("/student/promotional-printings/orders/order/:orderId")
  @UsePipes(new ZodPipe(apiPrt003))
  async getStudentPromotionalPrintingsOrder(
    @GetStudent() user: GetStudent,
    @Param() parameter: ApiPrt003RequestParam,
  ): Promise<ApiPrt003ResponseOk> {
    const order =
      await this.promotionalPrintingService.getStudentPromotionalPrintingsOrder(
        parameter,
        user.studentId,
      );

    return order;
  }

  @Get("/student/promotional-printings/orders/my")
  @UsePipes(new ZodPipe(apiPrt005))
  async getStudentPromotionalPrintingsOrdersMy(
    @Query() query: ApiPrt005RequestQuery,
  ): Promise<ApiPrt005ResponseOk> {
    // TODO: studentId 넘겨주기
    const orders =
      await this.promotionalPrintingService.getStudentPromotionalPrintingsOrdersMy(
        query,
      );

    return orders;
  }
}
