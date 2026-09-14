import { useEffect, useState } from "react";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";

import useGetRegistrationAvailableClubs from "../services/useGetRegistrationAvailableClubs";
import { getClubRegistrationRedirectPath } from "../utils/getClubRegistrationRedirectPath";
import { getRegistrationUnavailableReason } from "../utils/getRegistrationUnavailableReason";

const useClubRegistrationEligibility = () => {
  const { isLoggedIn, profile } = useAuth();
  const available = useGetRegistrationAvailableClubs();
  const applications = useGetMyClubRegistration({ refetchOnMount: "always" });
  const deadline = useGetClubRegistrationDeadline({ refetchOnMount: "always" });
  const [, setNow] = useState(Date.now);

  // Keep an open entry screen in sync when the application period ends.
  useEffect(() => {
    const end = deadline.data?.deadline?.endTerm;
    if (!end) return undefined;
    const remaining = new Date(end).getTime() - Date.now();
    if (remaining <= 0) return undefined;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(remaining, 2 ** 31 - 1),
    );
    return () => clearTimeout(timer);
  }, [deadline.data]);

  return {
    deadline: deadline.data,
    applications: applications.data,
    registrationPath: getClubRegistrationRedirectPath(applications),
    isLoading: [available, applications, deadline].some(
      query =>
        !query.isError && (!query.isFetchedAfterMount || query.isFetching),
    ),
    getUnavailableReason: (type: RegistrationTypeEnum) =>
      getRegistrationUnavailableReason({
        type,
        isUndergraduate:
          isLoggedIn && profile?.type === UserTypeEnum.Undergraduate,
        available,
        applications,
        deadline,
      }),
  };
};

export default useClubRegistrationEligibility;
