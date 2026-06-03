import {
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  UsePipes,
} from "@nestjs/common";

import {
  apiOpC001,
  type ApiOpC001ResponseOK,
  apiOpC002,
  type ApiOpC002ResponseOK,
  apiOpC003,
  type ApiOpC003ResponseOK,
} from "@clubs/interface/api/operation-committee/index";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import {
  RANDOM_GENERATOR,
  RandomGenerator,
} from "@sparcs-clubs/api/common/random/random-generator";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { OperationCommitteeService } from "@sparcs-clubs/api/feature/operation-committee/service/operation-committee.service";

@Controller()
export class OperationCommitteeController {
  constructor(
    private readonly operationCommitteeService: OperationCommitteeService,
    @Inject(RANDOM_GENERATOR) private readonly randomGenerator: RandomGenerator,
  ) {}

  @Executive()
  @Post("/executive/operation-committees/secret-key")
  @UsePipes(new ZodPipe(apiOpC001))
  async createOperationCommitteeSecretKey(): Promise<ApiOpC001ResponseOK> {
    const secretKey = this.randomGenerator.hex(5);

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
  @UsePipes(new ZodPipe(apiOpC002))
  async findOperationCommitteeSecretKey(): Promise<ApiOpC002ResponseOK> {
    const activeKey =
      await this.operationCommitteeService.findOperationCommitteeSecretKey();
    return {
      message: "OperationCommittee secret keys retrieved successfully.",
      activeKey,
    };
  }

  @Executive()
  @Delete("/executive/operation-committees/secret-key")
  @UsePipes(new ZodPipe(apiOpC003))
  async deleteOperationCommitteeSecretKey(): Promise<ApiOpC003ResponseOK> {
    await this.operationCommitteeService.deleteOperationCommitteeSecretKey();
    return { message: "OperationCommittee secret key deleted successfully." };
  }
}
