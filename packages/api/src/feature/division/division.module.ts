import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import DivisionController from "./controller/division.controller";
import { DistrictRepository } from "./repository/district.repository";
import { DivisionRepository } from "./repository/division.repository";
import OldDivisionRepository from "./repository/old.division.repository";
import DivisionPublicService from "./service/division.public.service";
import DivisionService from "./service/division.service";

@Module({
  imports: [DrizzleModule],
  controllers: [DivisionController],
  providers: [
    OldDivisionRepository,
    DivisionService,
    DivisionPublicService,
    DivisionRepository,
    DistrictRepository,
  ],
  exports: [DivisionPublicService],
})
export default class DivisionModule {}
