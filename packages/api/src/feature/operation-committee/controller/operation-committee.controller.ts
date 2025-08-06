import { Body, Controller, Delete, Get, Post } from "@nestjs/common";

import { Public } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { OperationCommitteeService } from "@sparcs-clubs/api/feature/operation-committee/service/operation-committee.service";

@Controller()
export class OperationCommitteeController {
  constructor(
    private readonly operationCommitteeService: OperationCommitteeService,
  ) {}

  @Public()
  @Post("/executive/operation-committees/secret-key")
  async createOperationCommitteeSecretKey(
    @Body("secretKey") secretKey: string,
  ) {
    const createdKey =
      await this.operationCommitteeService.createOperationCommitteeSecretKey(
        secretKey,
      );
    return {
      message: "OperationCommittee secret key created successfully.",
      createdKey,
    };
  }

  @Public()
  @Get("/executive/operation-committees/secret-key")
  async findOperationCommitteeSecretKey() {
    const activeKeys =
      await this.operationCommitteeService.findOperationCommitteeSecretKey();
    return {
      message: "OperationCommittee secret keys retrieved successfully.",
      activeKeys,
    };
  }

  @Public()
  @Delete("/executive/operation-committees/secret-key")
  async deleteOperationCommitteeSecretKey() {
    await this.operationCommitteeService.deleteOperationCommitteeSecretKey();
    return { message: "OperationCommittee secret key deleted successfully." };
  }
}
