"use client";

import { useTranslations } from "next-intl";
import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import RentalDetailFrame from "@sparcs-clubs/web/features/rental-business/frames/RentalDetailFrame";

const MyRentalDetail = () => {
  const t = useTranslations("my.services");
  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: t("myPage"), path: "/my" },
          {
            name: t("rental.title"),
            path: "/my/rental-business",
          },
        ]}
        title={t("rental.title")}
        enableLast
      />
      <RentalDetailFrame />
    </FlexWrapper>
  );
};
export default MyRentalDetail;
