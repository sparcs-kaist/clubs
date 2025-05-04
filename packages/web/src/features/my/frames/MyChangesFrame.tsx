"use client";

import React, { useEffect, useState } from "react";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import useGetUserProfile from "@sparcs-clubs/web/common/services/getUserProfile";
import { ChangeDivisionPresidentStatusEnum } from "@sparcs-clubs/web/constants/changeDivisionPresident";
import MyChangeRepresentative from "@sparcs-clubs/web/features/my/components/MyChangeRepresentative";
import { useGetMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/getMyDelegateRequest";
import { useGetMyDivisionPresidentRequest } from "@sparcs-clubs/web/features/my/services/getMyDivisionPresidentRequest";

import MyChangeDivisionPresident from "../components/MyChangeDivisionPresident";

export const MyChangesFrame = () => {
  const { data, isLoading, isError, refetch } = useGetMyDelegateRequest();

  // TODO - Div005 & Div006 API 나오면 이 코드를 사용하도록 수정할 것
  // const {divisionPresidentData, divisionPresidentIsLoading, divisionPresidentIsError, divisionPresidentRefetch} = useGetMyDivisionPresidentRequest();
  const { data: divisionPresidentData } = useGetMyDivisionPresidentRequest();

  const { data: myProfile } = useGetUserProfile();

  const [clubDelegateType, setClubDelegateType] = useState<
    "Requested" | "Finished" | "Rejected"
  >("Finished");

  const [divisionPresidentType, setDivisionPresidentType] = useState<
    "Requested" | "Finished" | "Rejected"
  >("Finished");

  const onConfirmed = () => {
    //TODO - Div006 API call
  };
  const onRejected = () => {
    //TODO - Div006 API call
  };

  useEffect(() => {
    switch (data?.requests[0]?.clubDelegateChangeRequestStatusEnumId) {
      case ClubDelegateChangeRequestStatusEnum.Applied:
        setClubDelegateType("Requested");
        break;
      case ClubDelegateChangeRequestStatusEnum.Approved:
        setClubDelegateType("Finished");
        break;
      default:
        setClubDelegateType("Finished");
    }
    switch (
      divisionPresidentData?.requests[0]?.changeDivisionPresidentStatusEnumId
    ) {
      case ChangeDivisionPresidentStatusEnum.Requested:
        setDivisionPresidentType("Requested");
        break;
      case ChangeDivisionPresidentStatusEnum.Confirmed:
        setDivisionPresidentType("Finished");
        break;
      default:
        setDivisionPresidentType("Finished");
    }
  }, [data, divisionPresidentData]);
  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      {data?.requests &&
        data?.requests.length > 0 &&
        clubDelegateType !== "Rejected" && (
          <MyChangeRepresentative
            type={clubDelegateType}
            clubName={data?.requests[0].clubName}
            prevRepresentative={`${data?.requests[0].prevStudentNumber} ${data?.requests[0].prevStudentName}`}
            newRepresentative={`${myProfile?.studentNumber} ${myProfile?.name}`}
            refetch={refetch}
            requestId={data?.requests[0]?.id}
            setType={setClubDelegateType}
          />
        )}
      {divisionPresidentData?.requests &&
        divisionPresidentData?.requests.length > 0 &&
        (divisionPresidentData?.requests[0]
          ?.changeDivisionPresidentStatusEnumId ===
          ChangeDivisionPresidentStatusEnum.Requested ||
          divisionPresidentData?.requests[0]
            ?.changeDivisionPresidentStatusEnumId ===
            ChangeDivisionPresidentStatusEnum.Confirmed) &&
        (divisionPresidentType === "Requested" ||
          divisionPresidentType === "Finished") && (
          <MyChangeDivisionPresident
            status={
              divisionPresidentData?.requests[0]
                ?.changeDivisionPresidentStatusEnumId
            }
            prevPresident={`${divisionPresidentData?.requests[0].prevStudent.studentNumber} ${divisionPresidentData?.requests[0].prevStudent.name}`}
            newPresident={`${myProfile?.studentNumber} ${myProfile?.name}`}
            setType={setDivisionPresidentType}
            onConfirmed={onConfirmed}
            onRejected={onRejected}
            fetch={() => {}}
            phoneNumber={myProfile?.phoneNumber}
            divisionName={divisionPresidentData.requests[0].divisionName.name}
            // fetch={divisionPresidentRefetch} //TODO - activate this
          />
        )}
    </AsyncBoundary>
  );
};
