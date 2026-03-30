import { useMemo } from "react";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import useGetMyClub from "@sparcs-clubs/web/features/my/clubs/service/useGetMyClub";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import { useGetMyMemberRegistration } from "../services/useGetMyMemberRegistration";

const useGetMyRegistration = (clubId: number) => {
  const {
    data: myRegistrationList,
    isLoading: isRegistrationLoading,
    isError: isRegistrationError,
  } = useGetMyMemberRegistration();
  const {
    data: myClubList,
    isLoading: isMyClubLoading,
    isError: isMyClubError,
  } = useGetMyClub();
  const {
    semester,
    isLoading: isSemesterLoading,
    isError: isSemesterError,
  } = useGetSemesterNow();

  const isCurrentMember = useMemo(() => {
    if (!semester || !myClubList) {
      return false;
    }

    const currentSemester = myClubList.semesters.find(
      semesterClub => semesterClub.id === semester.id,
    );

    return (
      currentSemester?.clubs.some(currentClub => currentClub.id === clubId) ??
      false
    );
  }, [semester, myClubList, clubId]);

  const registrationStatus = useMemo(() => {
    if (isCurrentMember) {
      return RegistrationApplicationStudentStatusEnum.Approved;
    }

    const thisRegistration = myRegistrationList?.applies.find(
      apply => apply.clubId === clubId,
    );
    return (
      thisRegistration?.applyStatusEnumId ??
      RegistrationApplicationStudentStatusEnum.Rejected
    );
  }, [isCurrentMember, myRegistrationList, clubId]);

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
    isLoading: isRegistrationLoading || isMyClubLoading || isSemesterLoading,
    isError: isRegistrationError || isMyClubError || isSemesterError,
  };
};

export default useGetMyRegistration;
