"use client";

import { addDays, subSeconds } from "date-fns";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ClubsListFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsListFrame";
import ClubsStudentFrame from "@sparcs-clubs/web/features/clubs/frames/ClubsStudentFrame";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import Banner from "@sparcs-clubs/web/features/landing/components/Banner";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";
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

  const {
    data,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetClubRegistrationDeadline();

  return (
    <ResponsiveWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: t("동아리 목록"), path: "/clubs" }]}
        title={t("동아리 목록")}
      />
      <AsyncBoundary isLoading={isLoadingDeadline} isError={isErrorDeadline}>
        {data?.deadline && (
          <Banner icon="warning">
            <Typography
              fs={16}
              lh={24}
              color="GRAY.600"
              style={{ whiteSpace: "pre-line" }}
            >
              {/* endTerm에 하루를 더해서 종료일 전체를 포함하도록 함 */}
              {/* 예: 종료일이 1/16(1/16 00:00)이면, 1/16 23:59:59까지 유효하도록 함 */}
              {`"${formatDate(data?.deadline?.startDate)} - ${formatDate(subSeconds(addDays(data?.deadline?.endTerm, 1), 1))}"은 동아리 등록 기간입니다.
              가을학기 동아리가 확정되지 않아 동아리 목록이 비어있어요. 동아리 대표자들께선 동아리 → 동아리 등록 기능을 통해 동아리 등록을 제출해주세요!`}
            </Typography>
          </Banner>
        )}
      </AsyncBoundary>
      {isLoggedIn && isStudent(profile) ? (
        <ClubsStudentFrame />
      ) : (
        <ClubsListFrame isRegistrationPeriod={false} />
      )}
    </ResponsiveWrapper>
  );
};

export default Clubs;
