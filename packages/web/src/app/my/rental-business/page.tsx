"use client";

import { useTranslations } from "next-intl";
import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { mockupMyRental } from "@sparcs-clubs/web/features/my/services/_mock/mockMyClub";
import MyRentalTable from "@sparcs-clubs/web/features/rental-business/components/MyRentalTable";

const MyRentalBusiness = () => {
  const t = useTranslations("my.services");
  return (
    <FlexWrapper direction="column" gap={20}>
      <PageHead
        items={[
          { name: t("myPage"), path: "/my" },
          { name: t("rental.title"), path: "/my/rental-business" },
        ]}
        title={t("rental.title")}
      />
      <MyRentalTable rentalList={mockupMyRental} withCount />
    </FlexWrapper>
  );
};

export default MyRentalBusiness;
