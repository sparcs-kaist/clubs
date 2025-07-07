import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import ClubModule from "@sparcs-clubs/api/feature/club/club.module";

import { PromotionalPrintingController } from "./controller/promotional-printing.controller";
import { PromotionalPrintingOrderRepository } from "./repository/promotional-printing-order.repository";
import { PromotionalPrintingOrderSizeRepository } from "./repository/promotional-printing-order-size.repository";
import { PromotionalPrintingService } from "./service/promotional-printing.service";

@Module({
  imports: [ClubModule, DrizzleModule],
  controllers: [PromotionalPrintingController],
  providers: [
    PromotionalPrintingService,
    PromotionalPrintingOrderRepository,
    PromotionalPrintingOrderSizeRepository,
  ],
})
export class PromotionalPrintingModule {}
