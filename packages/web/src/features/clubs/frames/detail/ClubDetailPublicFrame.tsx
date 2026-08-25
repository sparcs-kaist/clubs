"use client";

import { useTranslations } from "next-intl";
import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { ClubDetailProps } from "@sparcs-clubs/web/features/clubs/components/ClubDetailCard";
import ClubRegistrationCancellationButton from "@sparcs-clubs/web/features/clubs/components/ClubRegistrationCancellationButton";
import { useLanguage } from "@sparcs-clubs/web/i18n/hooks/useLanguage";

import ClubDetailInfoFrame from "./ClubDetailInfoFrame";

interface ClubDetailPublicFrameProps extends ClubDetailProps {
  canCancelRegistration?: boolean;
}

const ClubDetailPublicFrame: React.FC<ClubDetailPublicFrameProps> = ({
  club,
  canCancelRegistration = false,
}) => {
  const { isEnglish } = useLanguage();
  const t = useTranslations("club");

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: t("동아리 목록"), path: "/clubs" },
          {
            name: isEnglish ? club.nameEn : club.nameKr,
            path: `/clubs/${club.id}`,
          },
        ]}
        title={club.nameKr}
        action={
          canCancelRegistration && (
            <ClubRegistrationCancellationButton
              clubId={club.id}
              clubName={club.nameKr}
            />
          )
        }
      />
      <ClubDetailInfoFrame club={club} isRegistrationPeriod={false} />
    </FlexWrapper>
  );
};

export default ClubDetailPublicFrame;
