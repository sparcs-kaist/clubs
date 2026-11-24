import { Module } from "@nestjs/common";

import ClubModule from "@sparcs-clubs/api/feature/club/club.module";
import { OfficeHoursModule } from "@sparcs-clubs/api/feature/office-hours/office-hours.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { RentalController } from "./controller/rental.controller";
import { RentalRepository } from "./repository/rental.repository";
import { RentalService } from "./service/rental.service";
import { RentalReadService } from "./service/rental-read.service";
import { RentalScheduleService } from "./service/rental-schedule.service";

@Module({
  imports: [ClubModule, OfficeHoursModule, UserModule],
  controllers: [RentalController],
  providers: [
    RentalRepository,
    RentalReadService,
    RentalScheduleService,
    RentalService,
  ],
})
export class RentalModule {}
