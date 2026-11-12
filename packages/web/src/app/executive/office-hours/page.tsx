"use client";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import OfficeHoursFrame from "@sparcs-clubs/web/features/office-hours/OfficeHoursFrame";

const ExecutiveOfficeHoursPage = () => {
  const { isLoggedIn, login, profile } = useAuth();

  if (!isLoggedIn) return <LoginRequired login={login} />;
  if (profile?.type !== UserTypeEnum.Executive) return <NotFound />;

  return <OfficeHoursFrame executive />;
};

export default ExecutiveOfficeHoursPage;
