import { useMemo } from "react";

import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { useGetMyMemberRegistration } from "../services/useGetMyMemberRegistration";

const useGetMyRegistration = (clubId: number) => {
  const {
    data: myRegistrationList,
    isLoading,
    isError,
  } = useGetMyMemberRegistration();

  const registrationStatus = useMemo(() => {
    const thisRegistration = myRegistrationList?.applies.find(
      apply => apply.clubId === clubId,
    );
    return (
      thisRegistration?.applyStatusEnumId ??
      RegistrationApplicationStudentStatusEnum.Rejected
    );
  }, [myRegistrationList, clubId]);

  const isRegistered = useMemo(
    () =>
      registrationStatus !== RegistrationApplicationStudentStatusEnum.Rejected,
    [registrationStatus],
  );

  return {
    data: {
      registrationStatus,
      isRegistered,
      registrations: myRegistrationList ?? { applies: [] },
    },
    isLoading,
    isError,
  };
};

export default useGetMyRegistration;
