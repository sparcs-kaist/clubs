"use client";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import MyChangeRepresentative from "@sparcs-clubs/web/features/my/components/MyChangeRepresentative";
import { useGetMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/getMyDelegateRequest";

export const MyChangesFrame = ({ profile }: { profile: string }) => {
  const { data, isLoading, isError } = useGetMyDelegateRequest();
  const requests = data?.requests.filter(
    request =>
      request.clubDelegateChangeRequestStatusEnumId ===
        ClubDelegateChangeRequestStatusEnum.Applied ||
      request.clubDelegateChangeRequestStatusEnumId ===
        ClubDelegateChangeRequestStatusEnum.Approved,
  );

  if (!isLoading && !isError && !requests?.length) return null;

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={12}>
        {requests?.map(request => (
          <MyChangeRepresentative
            key={request.id}
            status={request.clubDelegateChangeRequestStatusEnumId}
            clubName={request.clubName}
            delegateEnumId={request.delegateEnumId}
            requester={`${request.prevStudentNumber} ${request.prevStudentName}`}
            requestId={request.id}
            profile={profile}
          />
        ))}
      </FlexWrapper>
    </AsyncBoundary>
  );
};
