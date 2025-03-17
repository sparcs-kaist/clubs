import { subSeconds } from "date-fns";
import { useEffect, useState } from "react";

import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { useGetRegistrationTerm } from "@sparcs-clubs/web/features/clubs/services/useGetRegistrationTerm";

const useGetMemberRegistrationPeriod = () => {
  const {
    data: termData,
    isLoading: isLoadingTerm,
    isError: isErrorTerm,
  } = useGetRegistrationTerm();

  const [registrationPeriod, setRegistrationPeriod] = useState<Date | null>(
    null,
  );

  useEffect(() => {
    if (termData) {
      const now = new Date();
      const currentEvents = termData.events.filter(
        event =>
          now >= new Date(event.startTerm) && now <= new Date(event.endTerm),
      );

      if (currentEvents.length > 0) {
        const memberRegistration = currentEvents.filter(
          event =>
            event.registrationEventEnumId ===
            RegistrationDeadlineEnum.StudentRegistrationApplication,
        );

        if (memberRegistration.length > 0) {
          setRegistrationPeriod(memberRegistration[0].endTerm);
        }
      }
    }
  }, [termData]);

  return {
    data: {
      isMemberRegistrationPeriod: registrationPeriod != null,
      deadline: registrationPeriod ? subSeconds(registrationPeriod, 1) : null,
    },
    isLoading: isLoadingTerm,
    isError: isErrorTerm,
  };
};

export default useGetMemberRegistrationPeriod;
