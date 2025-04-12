import { Controller, Get, Post, UsePipes } from "@nestjs/common";

import type { ApiUsr004ResponseCreated } from "@clubs/interface/api/user/endpoint/apiUsr004";
import apiUsr004 from "@clubs/interface/api/user/endpoint/apiUsr004";
import type { ApiUsr005ResponseOk } from "@clubs/interface/api/user/endpoint/apiUsr005";
import apiUsr005 from "@clubs/interface/api/user/endpoint/apiUsr005";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { GetUser } from "@sparcs-clubs/api/common/util/decorators/param-decorator";
import logger from "@sparcs-clubs/api/common/util/logger";

import PrivacyPolicyService from "./privacy-policy.service";

@Controller()
export default class PrivacyPolicyController {
  constructor(private readonly privacyPolicyService: PrivacyPolicyService) {}

  @Get("/user/privacy-policy/status")
  @UsePipes(new ZodPipe(apiUsr005))
  async getUserPrivacyPolicyStatus(
    @GetUser() user: GetUser,
  ): Promise<ApiUsr005ResponseOk> {
    logger.debug(`[postUserPrivacyPolicyAgree] checking userId ${user.id}`);
    const result = await this.privacyPolicyService.getUserPrivacyPolicyStatus({
      userId: user.id,
    });
    return result;
  }

  @Post("/user/privacy-policy/agree")
  @UsePipes(new ZodPipe(apiUsr004))
  async postUserPrivacyPolicyAgree(
    @GetUser() user: GetUser,
  ): Promise<ApiUsr004ResponseCreated> {
    logger.debug(`[postUserPrivacyPolicyAgree] checking userId ${user.id}`);

    const result = await this.privacyPolicyService.postUserPrivacyPolicyAgree({
      userId: user.id,
    });

    return result;
  }
}
