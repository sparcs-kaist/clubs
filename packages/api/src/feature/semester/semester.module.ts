import { Module } from "@nestjs/common";
import { DrizzleModule } from "src/drizzle/drizzle.module";

import SemesterController from "./controller/semester.controller";
import SemesterRepository from "./repository/semester.repository";
import SemesterService from "./service/semester.service";

@Module({
  imports: [DrizzleModule],
  controllers: [SemesterController],
  providers: [SemesterRepository, SemesterService],
  exports: [],
})
export default class SemesterModule {}
