import { ApiReg012ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg012";

import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@sparcs-clubs/interface/common/enum/registration.enum";

export const mockMyRegistration: ApiReg012ResponseOk = {
  registrations: [
    {
      id: 1,
      registrationTypeEnumId: RegistrationTypeEnum.NewProvisional,
      registrationStatusEnumId: RegistrationStatusEnum.Pending,
      divisionName: "테스트 분과",
      clubNameKr: "테스트 동아리",
      activityFieldKr: "테스트 활동분야",
      activityFieldEn: "Test Activity Field",
      professorName: "테스트 교수",
    },
  ],
};
