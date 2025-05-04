import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

export const isProvisional = (registrationTypeEnumId: RegistrationTypeEnum) =>
  [
    RegistrationTypeEnum.NewProvisional,
    RegistrationTypeEnum.ReProvisional,
  ].includes(registrationTypeEnumId);
