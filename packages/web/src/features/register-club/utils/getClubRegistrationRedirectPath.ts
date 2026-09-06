import type { UseQueryResult } from "@tanstack/react-query";

export const getClubRegistrationRedirectPath = ({
  data,
  isFetchedAfterMount,
  isFetching,
  isError,
}: Pick<
  UseQueryResult<{ registrations: { id: number }[] }>,
  "data" | "isFetchedAfterMount" | "isFetching" | "isError"
>): string | null => {
  if (!isFetchedAfterMount || isFetching || isError) return null;

  const registrations = data?.registrations ?? [];
  if (registrations.length === 0) return null;
  if (registrations.length === 1)
    return `/my/register-club/${registrations[0].id}`;
  return "/my";
};
