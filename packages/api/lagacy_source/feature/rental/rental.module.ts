import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import { RentalController } from "./controller/rental.controller";
import { RentalObjectRepository } from "./repository/rental.rental-object.repository";
import { RentalOrderRepository } from "./repository/rental.rental-order.repository";
import { RentalServiceRepository } from "./repository/rental.rental-service.repository";
import { RentalService } from "./service/rental.service";

@Module({
  imports: [DrizzleModule],
  controllers: [RentalController],
  providers: [
    RentalService,
    RentalObjectRepository,
    RentalServiceRepository,
    RentalOrderRepository,
  ],
})
export class RentalModule {}
