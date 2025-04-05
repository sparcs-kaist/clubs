import { Controller } from "@nestjs/common";

import { RegistrationService } from "../service/registration.service";

@Controller()
export class RegistrationController {
  constructor(private registrationService: RegistrationService) {}
}
