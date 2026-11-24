"use client";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import type { Profile } from "@sparcs-clubs/web/common/providers/AuthContext";
import MyChangeRepresentative from "@sparcs-clubs/web/features/my/components/MyChangeRepresentative";
import { useGetMyDelegateRequest } from "@sparcs-clubs/web/features/my/services/getMyDelegateRequest";

export const MyChangesFrame = ({ profile }: { profile: Profile }) => {
  const { data, isLoading, isError } = useGetMyDelegateRequest(profile);
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
            request={request}
            profile={profile}
          />
        ))}
      </FlexWrapper>
    </AsyncBoundary>
  );
};
