import { Injectable } from "@nestjs/common";

import { OperationCommitteeRepository } from "@sparcs-clubs/api/feature/operation-committee/repository/operation-committee.repository";

@Injectable()
export class OperationCommitteeService {
  constructor(
    private readonly operationCommitteeRepository: OperationCommitteeRepository,
  ) {}

  async createOperationCommitteeSecretKey(secretKey: string) {
    const createdKey =
      await this.operationCommitteeRepository.createOperationCommitteeSecretKey(
        secretKey,
      );
    return createdKey;
  }

  async findOperationCommitteeSecretKey() {
    const activeKeys =
      await this.operationCommitteeRepository.findOperationCommitteeSecretKey();
    return activeKeys;
  }

  async deleteOperationCommitteeSecretKey() {
    await this.operationCommitteeRepository.deleteOperationCommitteeSecretKey();
    return { message: "OperationCommittee secret key deleted successfully." };
  }
}
