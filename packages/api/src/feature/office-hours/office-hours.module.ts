import { Module } from "@nestjs/common";

import { OfficeHoursController } from "./controller/office-hours.controller";
import { OfficeHoursPublicService } from "./publicService/office-hours.public.service";
import { OfficeHoursRepository } from "./repository/office-hours.repository";
import { OfficeHoursService } from "./service/office-hours.service";

@Module({
  controllers: [OfficeHoursController],
  providers: [
    OfficeHoursRepository,
    OfficeHoursPublicService,
    OfficeHoursService,
  ],
  exports: [OfficeHoursPublicService],
})
export class OfficeHoursModule {}
