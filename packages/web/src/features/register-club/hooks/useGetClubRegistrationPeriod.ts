import { subSeconds } from "date-fns";
import { useEffect, useState } from "react";

import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { useGetRegistrationTerm } from "@sparcs-clubs/web/features/clubs/services/useGetRegistrationTerm";

const useGetClubRegistrationPeriod = () => {
  const {
    data: termData,
    isLoading: isLoadingTerm,
    isError: isErrorTerm,
  } = useGetRegistrationTerm();

  const [clubRegistrationPeriodEnd, setClubRegistrationPeriodEnd] =
    useState<Date | null>(null);

  useEffect(() => {
    if (termData) {
      const now = new Date();
      const currentEvents = termData.events.filter(
        event =>
          now >= new Date(event.startTerm) && now <= new Date(event.endTerm),
      );
      if (currentEvents.length === 0) return;

      const registrationEvent = currentEvents.filter(
        event =>
          event.registrationEventEnumId ===
          RegistrationDeadlineEnum.ClubRegistrationApplication,
      );
      if (registrationEvent.length > 0) {
        setClubRegistrationPeriodEnd(registrationEvent[0].endTerm);
      }
    }
  }, [termData]);

  return {
    data: {
      isClubRegistrationPeriod: clubRegistrationPeriodEnd != null,
      deadline: clubRegistrationPeriodEnd
        ? subSeconds(clubRegistrationPeriodEnd, 1)
        : null,
    },
    isLoading: isLoadingTerm,
    isError: isErrorTerm,
  };
};

export default useGetClubRegistrationPeriod;
