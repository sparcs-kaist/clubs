import { Injectable } from "@nestjs/common";
import { Propagation, Transactional } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import { SsoLoginFailureRepository } from "../repository/sso-login-failure/sso-login-failure.repository";

@Injectable()
export class SsoLoginFailureService {
  constructor(private readonly repository: SsoLoginFailureRepository) {}

  // One autocommit INSERT, independent of any failed or still active login transaction.
  @Transactional(Propagation.NotSupported)
  async record(data: Prisma.AuthSsoLoginFailureLogCreateInput): Promise<void> {
    await this.repository.create(data);
  }
}
