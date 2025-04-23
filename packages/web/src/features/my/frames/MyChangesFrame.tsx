"use client";

import React, { useEffect, useState } from "react";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import useGetUserProfile from "@sparcs-clubs/web/common/services/getUserProfile";
import MyChangeRepresentative from "@sparcs-clubs/web/features/my/components/MyChangeRepresentative";
import { useGetMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/getMyDelegateRequest";

export const MyChangesFrame = () => {
  const { data, isLoading, isError, refetch } = useGetMyDelegateRequest();

  const { data: myProfile } = useGetUserProfile();

  const [type, setType] = useState<"Requested" | "Finished" | "Rejected">(
    "Finished",
  );

  useEffect(() => {
    switch (data?.requests[0]?.clubDelegateChangeRequestStatusEnumId) {
      case ClubDelegateChangeRequestStatusEnum.Applied:
        setType("Requested");
        break;
      case ClubDelegateChangeRequestStatusEnum.Approved:
        setType("Finished");
        break;
      default:
        setType("Finished");
    }
  }, [data]);
  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      {data?.requests && data?.requests.length > 0 && type !== "Rejected" && (
        <MyChangeRepresentative
          type={type}
          clubName={data?.requests[0].clubName}
          prevRepresentative={`${data?.requests[0].prevStudentNumber} ${data?.requests[0].prevStudentName}`}
          newRepresentative={`${myProfile?.studentNumber} ${myProfile?.name}`}
          refetch={refetch}
          requestId={data?.requests[0]?.id}
          setType={setType}
        />
      )}
    </AsyncBoundary>
  );
};
