import type { ApiClb011ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb011";
import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

type DelegateRequest = ApiClb011ResponseOk["requests"][number];

export type DelegateRequestNoticeType = "Applied" | "Rejected" | "Canceled";

export const getDelegateRequestNoticeType = (
  request: DelegateRequest | undefined,
): DelegateRequestNoticeType | undefined => {
  if (!request) return undefined;
  if (request.isCanceled) return "Canceled";
  if (
    request.clubDelegateChangeRequestStatusEnumId ===
    ClubDelegateChangeRequestStatusEnum.Applied
  )
    return "Applied";
  if (
    request.clubDelegateChangeRequestStatusEnumId ===
    ClubDelegateChangeRequestStatusEnum.Rejected
  )
    return "Rejected";
  return undefined;
};

export const getDelegateRequestState = (requests: DelegateRequest[]) => {
  const latestByRole = new Map<number, DelegateRequest>();
  requests.forEach(request => {
    const previous = latestByRole.get(request.delegateEnumId);
    if (!previous || request.id > previous.id)
      latestByRole.set(request.delegateEnumId, request);
  });
  const latestRequests = [...latestByRole.values()];
  const pendingRequests = latestRequests.filter(
    request => getDelegateRequestNoticeType(request) === "Applied",
  );
  return {
    latestRequests,
    pendingRequests,
    pendingStudentIds: new Set(
      pendingRequests.map(request => request.studentId),
    ),
  };
};
