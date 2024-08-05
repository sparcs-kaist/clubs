"use client";

import { RegistrationTypeEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import RegisterClubMainFrame from "@sparcs-clubs/web/features/register-club/frame/RegisterClubMainFrame";

const ProvisionalRegisterClub = () => (
  <RegisterClubMainFrame type={RegistrationTypeEnum.Provisional} />
);

export default ProvisionalRegisterClub;
