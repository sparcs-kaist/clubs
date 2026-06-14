import { Module } from "@nestjs/common";

import { OperationCommitteeController } from "@sparcs-clubs/api/feature/operation-committee/controller/operation-committee.controller";
import { OperationCommitteeRepository } from "@sparcs-clubs/api/feature/operation-committee/repository/operation-committee.repository";
import { OperationCommitteePublicService } from "@sparcs-clubs/api/feature/operation-committee/service/operation-committee.public.service";
import { OperationCommitteeService } from "@sparcs-clubs/api/feature/operation-committee/service/operation-committee.service";

@Module({
  imports: [],
  controllers: [OperationCommitteeController],
  providers: [
    OperationCommitteeRepository,
    OperationCommitteeService,
    OperationCommitteePublicService,
  ],
  exports: [OperationCommitteePublicService],
})
export class OperationCommitteeModule {}
