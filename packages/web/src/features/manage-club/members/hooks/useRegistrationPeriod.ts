import { useEffect, useState } from "react";

import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

interface TermEvent {
  startTerm: Date;
  endTerm: Date;
  registrationEventEnumId: RegistrationDeadlineEnum;
}

interface TermData {
  events: TermEvent[];
}

export const useRegistrationPeriod = (termData: TermData | null) => {
  const [isRegistrationPeriod, setIsRegistrationPeriod] =
    useState<boolean>(false);
  const [memberRegistrationPeriodEnd, setMemberRegistrationPeriodEnd] =
    useState<Date>(new Date());

  useEffect(() => {
    if (termData) {
      const now = new Date();
      const currentEvents = termData.events.filter(
        (event: TermEvent) => now >= event.startTerm && now <= event.endTerm,
      );
      if (currentEvents.length === 0) {
        setIsRegistrationPeriod(false);
        return;
      }
      const registrationEvent = currentEvents.filter(
        (event: TermEvent) =>
          event.registrationEventEnumId ===
          RegistrationDeadlineEnum.StudentRegistrationApplication,
      );
      if (registrationEvent.length > 0) {
        setIsRegistrationPeriod(true);
        setMemberRegistrationPeriodEnd(registrationEvent[0].endTerm);
      } else {
        setIsRegistrationPeriod(false);
      }
    }
  }, [termData]);

  return { isRegistrationPeriod, memberRegistrationPeriodEnd };
};
