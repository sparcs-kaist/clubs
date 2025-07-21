"use client";

import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ClubsListFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsListFrame";
import ClubsStudentFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsStudentFrame";
import isStudent from "@sparcs-clubs/web/utils/isStudent";

const ResponsiveWrapper = styled(FlexWrapper)`
  gap: 60px;
  direction: column;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    gap: 40px;
  }
`;

const Clubs: React.FC = () => {
  const t = useTranslations("club");
  const { isLoggedIn, profile } = useAuth();

  return (
    <ResponsiveWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: t("동아리 목록"), path: "/clubs" }]}
        title={t("동아리 목록")}
      />
      {isLoggedIn && isStudent(profile) ? (
        <ClubsStudentFrame />
      ) : (
        <ClubsListFrame isRegistrationPeriod={false} />
      )}
    </ResponsiveWrapper>
  );
};

export default Clubs;
