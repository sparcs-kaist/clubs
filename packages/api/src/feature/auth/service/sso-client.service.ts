import { Inject, Injectable } from "@nestjs/common";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import {
  RANDOM_GENERATOR,
  RandomGenerator,
} from "@sparcs-clubs/api/common/random/random-generator";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import { SSOUser } from "../dto/sparcs-sso.dto";
import { Client } from "../util/sparcs-sso";

@Injectable()
export class SsoClientService {
  private readonly client: Client;

  constructor(
    appConfigService: AppConfigService,
    @Inject(CLOCK) clock: Clock,
    @Inject(RANDOM_GENERATOR) randomGenerator: RandomGenerator,
  ) {
    this.client = new Client(
      appConfigService.ssoClientId,
      appConfigService.ssoSecretKey,
      clock,
      randomGenerator,
    );
  }

  getLoginParams(): { url: string; state: string } {
    return this.client.get_login_params();
  }

  getUserInfo(code: string): Promise<SSOUser> {
    return this.client.get_user_info(code);
  }
}
