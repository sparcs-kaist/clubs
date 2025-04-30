import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import PrivacyPolicyController from "./privacy-policy.controller";
import PrivacyPolicyRepository from "./privacy-policy.repository";
import PrivacyPolicyService from "./privacy-policy.service";

@Module({
  imports: [DrizzleModule],
  controllers: [PrivacyPolicyController],
  providers: [PrivacyPolicyRepository, PrivacyPolicyService],
  exports: [],
})
export default class PrivacyPolicyModule {}
