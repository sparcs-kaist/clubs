import { Injectable } from "@nestjs/common";

import { OperationCommitteeService } from "./operation-committee.service";

@Injectable()
export class OperationCommitteePublicService {
  constructor(
    private readonly operationCommitteeService: OperationCommitteeService,
  ) {}

  async findOperationCommitteeSecretKey() {
    return this.operationCommitteeService.findOperationCommitteeSecretKey();
  }
}
