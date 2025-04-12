import { ApiReg012ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg012";
import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

export const mockMyRegistration: ApiReg012ResponseOk = {
  registrations: [
    {
      id: 1,
      clubId: 1,
      registrationTypeEnum: RegistrationTypeEnum.NewProvisional,
      registrationStatusEnum: RegistrationStatusEnum.Pending,
      divisionName: "테스트 분과",
      clubNameKr: "테스트 동아리",
      clubNameEn: "Test Club",
      newClubNameKr: "테스트 동아리",
      newClubNameEn: "Test Club",
      activityFieldKr: "테스트 활동분야",
      activityFieldEn: "Test Activity Field",
      professorName: "테스트 교수",
    },
  ],
};
