"use client";

import { useTranslations } from "next-intl";
import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { ClubDetailProps } from "@sparcs-clubs/web/features/clubs/components/ClubDetailCard";
import { useLanguage } from "@sparcs-clubs/web/i18n/hooks/useLanguage";

import ClubDetailInfoFrame from "./ClubDetailInfoFrame";

const ClubDetailPublicFrame: React.FC<
  ClubDetailProps & { listPath?: string }
> = ({ club, listPath = "/clubs" }) => {
  const { isEnglish } = useLanguage();
  const t = useTranslations("club");
  const clubName = isEnglish ? club.nameEn : club.nameKr;

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: t("동아리 목록"), path: listPath },
          {
            name: clubName,
            path: `/clubs/${club.id}`,
          },
        ]}
        title={clubName}
      />
      <ClubDetailInfoFrame club={club} isRegistrationPeriod={false} />
    </FlexWrapper>
  );
};

export default ClubDetailPublicFrame;
