import { Module } from "@nestjs/common";

import PrivacyPolicyController from "./privacy-policy.controller";
import PrivacyPolicyRepository from "./privacy-policy.repository";
import PrivacyPolicyService from "./privacy-policy.service";

@Module({
  imports: [],
  controllers: [PrivacyPolicyController],
  providers: [PrivacyPolicyRepository, PrivacyPolicyService],
  exports: [],
})
export default class PrivacyPolicyModule {}
