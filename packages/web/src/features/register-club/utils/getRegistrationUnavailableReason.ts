import type { UseQueryResult } from "@tanstack/react-query";

import type { ApiReg025ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg025";
import {
  type ApiReg027ResponseOk,
  isClubRegistrationOpen,
} from "@clubs/interface/api/registration/endpoint/apiReg027";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

type QueryState<T> = Pick<
  UseQueryResult<T>,
  "data" | "isFetchedAfterMount" | "isFetching" | "isError"
>;

export const getRegistrationUnavailableReason = ({
  type,
  isUndergraduate,
  available,
  applications,
  deadline,
  now = Date.now(),
}: {
  type: RegistrationTypeEnum;
  isUndergraduate: boolean;
  available: QueryState<ApiReg025ResponseOk>;
  applications: QueryState<{ registrations: { id: number }[] }>;
  deadline: QueryState<ApiReg027ResponseOk>;
  now?: number;
}) => {
  if (!isUndergraduate) return "eligibility.undergraduateOnly";
  const queries = [available, applications, deadline];
  if (queries.some(query => query.isError)) return "eligibility.loadError";
  if (
    queries.some(
      query => !query.isFetchedAfterMount || query.isFetching || !query.data,
    )
  )
    return "eligibility.checking";

  if (!Array.isArray(applications.data?.registrations))
    return "eligibility.applicationLoadError";
  if (applications.data.registrations.length > 0)
    return "eligibility.alreadyApplied";

  if (!isClubRegistrationOpen(deadline.data?.deadline, now))
    return "registrationClosed";

  const club = available.data?.club;
  if (club === null)
    return type === RegistrationTypeEnum.NewProvisional
      ? null
      : "eligibility.noManagedClub";
  if (!club) return "eligibility.unavailable";
  if (type === RegistrationTypeEnum.NewProvisional)
    return "eligibility.alreadyDelegate";
  if (!club.availableRegistrationTypeEnums.includes(type))
    return "eligibility.notEligible";
  return null;
};
