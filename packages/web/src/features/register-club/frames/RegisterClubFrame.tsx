"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Info from "@sparcs-clubs/web/common/components/Info";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import ClubButton from "@sparcs-clubs/web/features/register-club/components/ClubButton";
import {
  registerClubDeadlineInfoText,
  registerClubOptions,
} from "@sparcs-clubs/web/features/register-club/constants";

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
  const router = useRouter();
  const { deadline, registrationPath, isLoading, getUnavailableReason } =
    useClubRegistrationEligibility();

  useEffect(() => {
    if (registrationPath) router.replace(registrationPath);
  }, [registrationPath, router]);

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: "동아리 등록", path: "/register-club" }]}
        title="동아리 등록"
      />
      <AsyncBoundary isLoading={registrationPath !== null} isError={false}>
        {!isLoading && deadline?.deadline && (
          <Info
            text={registerClubDeadlineInfoText(
              deadline.deadline.endTerm,
              deadline.semester,
            )}
          />
        )}
        <ClubButtonWrapper>
          {registerClubOptions.map(({ type, title, buttonText, path }) => (
            <ClubButton
              key={type}
              title={title}
              buttonText={buttonText}
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
