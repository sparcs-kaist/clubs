import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from "@nestjs/common";
import type { z } from "zod";

import {
  apiRentalCancel,
  apiRentalCheckout,
  apiRentalCreate,
  apiRentalEligibleClubs,
  apiRentalExecutiveCancel,
  apiRentalExecutiveDetail,
  apiRentalExtend,
  apiRentalItemCreate,
  apiRentalItems,
  apiRentalItemsExecutive,
  apiRentalItemUpdate,
  apiRentalMyDetail,
  apiRentalReject,
  apiRentalReturn,
  apiRentalReturnOptions,
  apiRentalSchedule,
  apiRentalsExecutive,
  apiRentalsMy,
} from "@clubs/interface/api/rental/v2";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  Executive,
  Public,
  Student,
} from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import {
  GetExecutive,
  GetStudent,
} from "@sparcs-clubs/api/common/util/decorators/param-decorator";

import { RentalService } from "../service/rental.service";
import {
  RentalReadService,
  serializeItem,
} from "../service/rental-read.service";

type Input<T extends z.ZodTypeAny> = z.output<T>;

@Controller()
export class RentalController {
  constructor(
    private readonly rentals: RentalService,
    private readonly reads: RentalReadService,
  ) {}

  @Public()
  @Get("/rentals/items")
  @UsePipes(new ZodPipe(apiRentalItems))
  listItems() {
    return this.reads.items(false);
  }

  @Public()
  @Get("/rentals/items/:id/return-options")
  @UsePipes(new ZodPipe(apiRentalReturnOptions))
  returnOptions(
    @Param() { id }: Input<typeof apiRentalReturnOptions.requestParam>,
    @Query() { pickupDate }: Input<typeof apiRentalReturnOptions.requestQuery>,
  ) {
    return this.reads.returnOptions(id, pickupDate);
  }

  @Student()
  @Get("/student/rentals/eligible-clubs")
  @UsePipes(new ZodPipe(apiRentalEligibleClubs))
  eligibleClubs(@GetStudent() student: GetStudent) {
    return this.rentals.eligibleClubs(student.studentId);
  }

  @Student()
  @Get("/student/rentals")
  @UsePipes(new ZodPipe(apiRentalsMy))
  myList(
    @GetStudent() student: GetStudent,
    @Query() query: Input<typeof apiRentalsMy.requestQuery>,
  ) {
    return this.reads.myList(student.studentId, query);
  }

  @Student()
  @Get("/student/rentals/:id")
  @UsePipes(new ZodPipe(apiRentalMyDetail))
  myDetail(
    @GetStudent() student: GetStudent,
    @Param() { id }: Input<typeof apiRentalMyDetail.requestParam>,
  ) {
    return this.reads.myDetail(id, student.studentId);
  }

  @Student()
  @Post("/student/rentals")
  @UsePipes(new ZodPipe(apiRentalCreate))
  async create(
    @GetStudent() student: GetStudent,
    @Body() input: Input<typeof apiRentalCreate.requestBody>,
  ) {
    const row = await this.rentals.create(student.studentId, input);
    return this.reads.myDetail(row.id, student.studentId);
  }

  @Student()
  @Post("/student/rentals/:id/cancel")
  @HttpCode(200)
  @UsePipes(new ZodPipe(apiRentalCancel))
  async cancelMy(
    @GetStudent() student: GetStudent,
    @Param() { id }: Input<typeof apiRentalCancel.requestParam>,
  ) {
    await this.rentals.close(
      id,
      student.id,
      "CANCELLED",
      undefined,
      student.studentId,
    );
    return this.reads.myDetail(id, student.studentId);
  }

  @Executive()
  @Get("/executive/rental-items")
  @UsePipes(new ZodPipe(apiRentalItemsExecutive))
  listExecutiveItems() {
    return this.reads.items(true);
  }

  @Executive()
  @Post("/executive/rental-items")
  @UsePipes(new ZodPipe(apiRentalItemCreate))
  async createItem(
    @Body() input: Input<typeof apiRentalItemCreate.requestBody>,
  ) {
    return serializeItem(await this.rentals.createItem(input));
  }

  @Executive()
  @Patch("/executive/rental-items/:id")
  @UsePipes(new ZodPipe(apiRentalItemUpdate))
  async updateItem(
    @Param() { id }: Input<typeof apiRentalItemUpdate.requestParam>,
    @Body() input: Input<typeof apiRentalItemUpdate.requestBody>,
  ) {
    return serializeItem(await this.rentals.updateItem(id, input));
  }

  @Executive()
  @Get("/executive/rentals")
  @UsePipes(new ZodPipe(apiRentalsExecutive))
  listExecutive(
    @Query() query: Input<typeof apiRentalsExecutive.requestQuery>,
  ) {
    return this.reads.executiveList(query);
  }

  @Executive()
  @Get("/executive/rentals/:id")
  @UsePipes(new ZodPipe(apiRentalExecutiveDetail))
  detailExecutive(
    @Param() { id }: Input<typeof apiRentalExecutiveDetail.requestParam>,
  ) {
    return this.reads.executiveDetail(id);
  }

  @Executive()
  @Post("/executive/rentals/:id/checkout")
  @HttpCode(200)
  @UsePipes(new ZodPipe(apiRentalCheckout))
  async checkout(
    @GetExecutive() executive: GetExecutive,
    @Param() { id }: Input<typeof apiRentalCheckout.requestParam>,
    @Body() { memo }: Input<typeof apiRentalCheckout.requestBody>,
  ) {
    await this.rentals.checkout(id, executive.executiveId, memo);
    return this.reads.executiveDetail(id);
  }

  @Executive()
  @Post("/executive/rentals/:id/return")
  @HttpCode(200)
  @UsePipes(new ZodPipe(apiRentalReturn))
  async confirmReturn(
    @GetExecutive() executive: GetExecutive,
    @Param() { id }: Input<typeof apiRentalReturn.requestParam>,
  ) {
    await this.rentals.confirmReturn(id, executive.executiveId);
    return this.reads.executiveDetail(id);
  }

  @Executive()
  @Post("/executive/rentals/:id/cancel")
  @HttpCode(200)
  @UsePipes(new ZodPipe(apiRentalExecutiveCancel))
  async cancelExecutive(
    @GetExecutive() executive: GetExecutive,
    @Param() { id }: Input<typeof apiRentalExecutiveCancel.requestParam>,
    @Body() { reason }: Input<typeof apiRentalExecutiveCancel.requestBody>,
  ) {
    await this.rentals.close(id, executive.id, "CANCELLED", reason);
    return this.reads.executiveDetail(id);
  }

  @Executive()
  @Post("/executive/rentals/:id/reject")
  @HttpCode(200)
  @UsePipes(new ZodPipe(apiRentalReject))
  async reject(
    @GetExecutive() executive: GetExecutive,
    @Param() { id }: Input<typeof apiRentalReject.requestParam>,
    @Body() { reason }: Input<typeof apiRentalReject.requestBody>,
  ) {
    await this.rentals.close(id, executive.id, "REJECTED", reason);
    return this.reads.executiveDetail(id);
  }

  @Executive()
  @Patch("/executive/rentals/:id/schedule")
  @UsePipes(new ZodPipe(apiRentalSchedule))
  async reschedule(
    @Param() { id }: Input<typeof apiRentalSchedule.requestParam>,
    @Body() input: Input<typeof apiRentalSchedule.requestBody>,
  ) {
    await this.rentals.reschedule(id, input);
    return this.reads.executiveDetail(id);
  }

  @Executive()
  @Post("/executive/rentals/:id/extend")
  @HttpCode(200)
  @UsePipes(new ZodPipe(apiRentalExtend))
  async extend(
    @GetExecutive() executive: GetExecutive,
    @Param() { id }: Input<typeof apiRentalExtend.requestParam>,
    @Body() input: Input<typeof apiRentalExtend.requestBody>,
  ) {
    await this.rentals.extend(
      id,
      executive.executiveId,
      input.return,
      input.reason,
    );
    return this.reads.executiveDetail(id);
  }
}
