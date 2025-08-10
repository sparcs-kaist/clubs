import { Controller, Delete, Get, Post } from "@nestjs/common";
import { randomBytes } from "crypto";

import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { OperationCommitteeService } from "@sparcs-clubs/api/feature/operation-committee/service/operation-committee.service";

@Controller()
export class OperationCommitteeController {
  constructor(
    private readonly operationCommitteeService: OperationCommitteeService,
  ) {}

  @Executive()
  @Post("/executive/operation-committees/secret-key")
  async createOperationCommitteeSecretKey() {
    const secretKey = randomBytes(5).toString("hex");

    const createdKey =
      await this.operationCommitteeService.createOperationCommitteeSecretKey(
        secretKey,
      );

    return {
      message: "OperationCommittee secret key created successfully.",
      createdKey,
    };
  }

  @Executive()
  @Get("/executive/operation-committees/secret-key")
  async findOperationCommitteeSecretKey() {
    const activeKeys =
      await this.operationCommitteeService.findOperationCommitteeSecretKey();
    return {
      message: "OperationCommittee secret keys retrieved successfully.",
      activeKeys,
    };
  }

  @Executive()
  @Delete("/executive/operation-committees/secret-key")
  async deleteOperationCommitteeSecretKey() {
    await this.operationCommitteeService.deleteOperationCommitteeSecretKey();
    return { message: "OperationCommittee secret key deleted successfully." };
  }
}
