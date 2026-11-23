"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import type { ApiReg011ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg011";
import apiReg029 from "@clubs/interface/api/registration/endpoint/apiReg029";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import RegisterClubDetailFrame from "@sparcs-clubs/web/features/register-club/frames/RegisterClubDetailFrame";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const PreviousRegistrationDetail = () => {
  const t = useTranslations("registrationHistory");
  const router = useRouter();
  const clubId = useSearchParams().get("clubId");
  const backPath = clubId
    ? `/my/register-club/previous?${new URLSearchParams({ clubId })}`
    : "/my/register-club/previous";
  const { profile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const applyId = Number(id);
  const isValidApplyId = Number.isInteger(applyId) && applyId > 0;
  const url = apiReg029.url(applyId);
  const { data, error, isPending, isFetching, isError } = useQuery({
    queryKey: [url, profile?.studentId ?? profile?.id],
    enabled: isValidApplyId && !!profile,
    refetchOnMount: "always",
    queryFn: async () => {
      const response = await axiosClientWithAuth.get<ApiReg011ResponseOk>(url);
      return response.data;
    },
  });

  if (
    !isValidApplyId ||
    (isAxiosError(error) && error.response?.status === 404)
  ) {
    return <NotFound />;
  }

  return (
    <AsyncBoundary isLoading={isPending || isFetching} isError={isError}>
      {data && profile && (
        <RegisterClubDetailFrame clubDetail={data} profile={profile.type} />
      )}
      <Button
        style={{ width: "max-content" }}
        onClick={() => router.push(backPath)}
      >
        {t("backToList")}
      </Button>
    </AsyncBoundary>
  );
};

const PreviousRegistrationDetailPage = () => (
  <Suspense fallback={<AsyncBoundary isLoading isError={false} />}>
    <PreviousRegistrationDetail />
  </Suspense>
);

export default PreviousRegistrationDetailPage;
