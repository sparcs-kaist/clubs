import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
} from "@nestjs/common";

import apiRnt001, {
  ApiRnt001RequestQuery,
  ApiRnt001ResponseOK,
} from "@clubs/interface/api/rental/endpoint/apiRnt001";
import apiRnt002, {
  ApiRnt002RequestBody,
  ApiRnt002RequestQuery,
} from "@clubs/interface/api/rental/endpoint/apiRnt002";
import apiRnt003, {
  ApiRnt003RequestQuery,
  ApiRnt003ResponseOK,
} from "@clubs/interface/api/rental/endpoint/apiRnt003";
import apiRnt004, {
  ApiRnt004RequestParam,
  ApiRnt004ResponseOK,
} from "@clubs/interface/api/rental/endpoint/apiRnt004";
import apiRnt006, {
  ApiRnt006RequestQuery,
  ApiRnt006ResponseOK,
} from "@clubs/interface/api/rental/endpoint/apiRnt006";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";

import { RentalService } from "../service/rental.service";

@Controller()
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Get("/rentals/objects/available")
  @UsePipes(new ZodPipe(apiRnt001))
  async getRentalsObjectsAvailable(
    @Query() query: ApiRnt001RequestQuery,
  ): Promise<ApiRnt001ResponseOK> {
    const availableObjects =
      await this.rentalService.getRentalsObjectsAvailable(
        query.startDate,
        query.endTerm,
      );
    return { objects: availableObjects };
  }

  @Post("/student/rentals/rental")
  @UsePipes(new ZodPipe(apiRnt002))
  async postRental(
    @Query() query: ApiRnt002RequestQuery,
    @Body() body: ApiRnt002RequestBody,
  ) {
    const { clubId } = query;
    const studentId = 1;
    await this.rentalService.postRental(studentId, clubId, body);
  }

  @Get("/student/rentals")
  @UsePipes(new ZodPipe(apiRnt003))
  async getRentals(
    @Query() query: ApiRnt003RequestQuery,
  ): Promise<ApiRnt003ResponseOK> {
    const rentals = await this.rentalService.getRentals(query);
    return rentals;
  }

  @Get("/student/rentals/rental/:rentalId")
  @UsePipes(new ZodPipe(apiRnt004))
  async getRental(
    @Param() param: ApiRnt004RequestParam,
  ): Promise<ApiRnt004ResponseOK> {
    const rental = await this.rentalService.getRental(param.rentalId);
    return rental;
  }

  @Get("/student/rentals/my")
  @UsePipes(new ZodPipe(apiRnt006))
  async getRentalsMy(
    @Query() query: ApiRnt006RequestQuery,
  ): Promise<ApiRnt006ResponseOK> {
    const rental = await this.rentalService.getRentalsMy(query);
    return rental;
  }
}
