import type { UseQueryResult } from "@tanstack/react-query";

import type { ApiReg025ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg025";
import type { ApiReg027ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg027";
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
}): string | null => {
  if (!isUndergraduate) return "로그인한 학부생만 신청할 수 있습니다.";
  const queries = [available, applications, deadline];
  if (queries.some(query => query.isError))
    return "신청 자격을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.";
  if (
    queries.some(
      query => !query.isFetchedAfterMount || query.isFetching || !query.data,
    )
  )
    return "신청 자격을 확인하고 있습니다.";

  if (!Array.isArray(applications.data?.registrations))
    return "신청 내역을 확인하지 못했습니다. 새로고침 후 다시 시도해주세요.";
  if (applications.data.registrations.length > 0)
    return "이번 학기에 제출한 신청이 있습니다. 신청 내역을 확인해주세요.";

  const period = deadline.data?.deadline;
  if (
    !period ||
    !(
      new Date(period.startDate).getTime() <= now &&
      now < new Date(period.endTerm).getTime()
    )
  )
    return "현재는 동아리 등록 신청 기간이 아닙니다.";

  const club = available.data?.club;
  if (club === null)
    return type === RegistrationTypeEnum.NewProvisional
      ? null
      : "현재 대표자·대의원으로 관리하는 동아리가 없습니다.";
  if (!club) return "신청 자격을 확인하지 못했습니다. 다시 조회해주세요.";
  if (type === RegistrationTypeEnum.NewProvisional)
    return "이미 동아리 대표자·대의원으로 등록되어 있습니다. 기존 동아리의 등록 유형을 선택해주세요.";
  if (!club.availableRegistrationTypeEnums.includes(type))
    return "해당 동아리의 신청 내역이 이미 존재하거나 이 등록 유형의 신청 조건을 충족하지 않습니다.";
  return null;
};
