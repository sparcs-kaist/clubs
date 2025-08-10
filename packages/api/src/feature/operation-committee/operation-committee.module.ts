import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import { OperationCommitteeController } from "@sparcs-clubs/api/feature/operation-committee/controller/operation-committee.controller";
import { OperationCommitteeRepository } from "@sparcs-clubs/api/feature/operation-committee/repository/operation-committee.repository";
import { OperationCommitteeService } from "@sparcs-clubs/api/feature/operation-committee/service/operation-committee.service";

@Module({
  imports: [DrizzleModule],
  controllers: [OperationCommitteeController],
  providers: [OperationCommitteeRepository, OperationCommitteeService],
  exports: [OperationCommitteeService],
})
export class OperationCommitteeModule {}
