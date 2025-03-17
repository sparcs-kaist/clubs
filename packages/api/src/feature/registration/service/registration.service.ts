import { Injectable } from "@nestjs/common";

import { RegistrationRepository } from "../repository/registration.repository";

@Injectable()
export class RegistrationService {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
  ) {}
}
