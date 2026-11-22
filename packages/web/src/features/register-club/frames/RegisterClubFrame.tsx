"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";
import styled from "styled-components";

import { isClubRegistrationOpen } from "@clubs/interface/api/registration/endpoint/apiReg027";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import ClubButton from "@sparcs-clubs/web/features/register-club/components/ClubButton";
import RegistrationDeadlineInfo from "@sparcs-clubs/web/features/register-club/components/RegistrationDeadlineInfo";
import { registerClubOptions } from "@sparcs-clubs/web/features/register-club/constants";

import useClubRegistrationEligibility from "../hooks/useClubRegistrationEligibility";

const ClubButtonWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    grid-template-columns: 1fr;
  }
`;

const RegisterClubFrame: React.FC = () => {
  const t = useTranslations("my.registration");
  const historyT = useTranslations("registrationHistory");
  const router = useRouter();
  const { deadline, registrationPath, isLoading, getUnavailableReason } =
    useClubRegistrationEligibility();

  useEffect(() => {
    if (registrationPath) router.replace(registrationPath);
  }, [registrationPath, router]);

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: t("title"), path: "/register-club" }]}
        title={t("title")}
        action={
          <Link
            href="/my/register-club/previous"
            style={{ textDecoration: "underline" }}
          >
            {historyT("title")}
          </Link>
        }
      />
      <AsyncBoundary isLoading={registrationPath !== null} isError={false}>
        {!isLoading &&
          deadline?.deadline &&
          isClubRegistrationOpen(deadline.deadline) && (
            <RegistrationDeadlineInfo
              deadline={deadline.deadline.endTerm}
              semester={deadline.semester}
            />
          )}
        <ClubButtonWrapper>
          {registerClubOptions.map(({ type, requirements, path }) => (
            <ClubButton
              key={type}
              title={t(`types.${type}`)}
              buttonText={requirements.map(key => t(`requirements.${key}`))}
              unavailableReason={getUnavailableReason(type)}
              onClick={() => {
                if (!getUnavailableReason(type)) router.push(path);
              }}
            />
          ))}
        </ClubButtonWrapper>
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default RegisterClubFrame;
