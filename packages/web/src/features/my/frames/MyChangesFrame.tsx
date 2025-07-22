"use client";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import useGetUserProfile from "@sparcs-clubs/web/common/services/getUserProfile";
import MyChangeRepresentative from "@sparcs-clubs/web/features/my/components/MyChangeRepresentative";
import { useGetMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/getMyDelegateRequest";

export const MyChangesFrame = () => {
  const {
    data: rawClubDelegateData,
    isLoading: clubDelegateIsLoading,
    isError: clubDelegateIsError,
  } = useGetMyDelegateRequest();

  const clubDelegateDataExists =
    rawClubDelegateData?.requests && rawClubDelegateData?.requests.length > 0;

  const clubDelegateData = clubDelegateDataExists
    ? rawClubDelegateData.requests[0]
    : undefined;

  // TODO - Div005 & Div006 API 나오면 이 코드를 사용하도록 수정할 것
  // const {rawDivisionPresidentData, divisionPresidentIsLoading, divisionPresidentIsError, divisionPresidentRefetch} = useGetMyDivisionPresidentRequest();
  // const {
  //   data: rawDivisionPresidentData,
  //   isLoading: divisionPresidentIsLoading,
  //   isError: divisionPresidentIsError,
  // } = useGetMyDivisionPresidentRequest();

  // const divisionPresidentDataExists =
  //   rawDivisionPresidentData?.requests &&
  //   rawDivisionPresidentData?.requests.length > 0;

  // const divisionPresidentData = divisionPresidentDataExists
  //   ? rawDivisionPresidentData.requests[0]
  //   : undefined;

  const { data: myProfile } = useGetUserProfile();

  if (!clubDelegateDataExists) {
    return null;
  }

  return (
    <>
      <AsyncBoundary
        isLoading={clubDelegateIsLoading}
        isError={clubDelegateIsError}
      >
        {clubDelegateDataExists &&
          (clubDelegateData?.clubDelegateChangeRequestStatusEnumId ===
            ClubDelegateChangeRequestStatusEnum.Applied ||
            clubDelegateData?.clubDelegateChangeRequestStatusEnumId ===
              ClubDelegateChangeRequestStatusEnum.Approved) && (
            <MyChangeRepresentative
              status={clubDelegateData.clubDelegateChangeRequestStatusEnumId}
              clubName={clubDelegateData!.clubName}
              prevRepresentative={`${clubDelegateData!.prevStudentNumber} ${clubDelegateData!.prevStudentName}`}
              newRepresentative={`${myProfile?.studentNumber} ${myProfile?.name}`}
              requestId={clubDelegateData!.id}
            />
          )}
      </AsyncBoundary>
      {/* <AsyncBoundary
        isLoading={divisionPresidentIsLoading}
        isError={divisionPresidentIsError}
      >
        {divisionPresidentDataExists &&
          (divisionPresidentData?.changeDivisionPresidentStatusEnumId ===
            ChangeDivisionPresidentStatusEnum.Requested ||
            divisionPresidentData?.changeDivisionPresidentStatusEnumId ===
              ChangeDivisionPresidentStatusEnum.Confirmed) && (
            <MyChangeDivisionPresident
              status={divisionPresidentData.changeDivisionPresidentStatusEnumId}
              prevPresident={`${divisionPresidentData.prevStudent.studentNumber} ${divisionPresidentData.prevStudent.name}`}
              newPresident={`${myProfile?.studentNumber} ${myProfile?.name}`}
              phoneNumber={myProfile?.phoneNumber}
              divisionName={divisionPresidentData.divisionName.name}
            />
          )}
      </AsyncBoundary> */}
    </>
  );
};
