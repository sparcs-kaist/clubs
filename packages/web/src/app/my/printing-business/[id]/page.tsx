"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

import { PromotionalPrintingOrderStatusEnum } from "@clubs/interface/common/enum/promotionalPrinting.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import PrintingProgress from "@sparcs-clubs/web/features/printing-business/components/PrintingProgress";
import PrintingDetailFrame from "@sparcs-clubs/web/features/printing-business/frames/PrintingDetailFrame";

const MyPrintingDetail = () => {
  const t = useTranslations("my.services");
  const router = useRouter();
  const onClick = () => {
    router.push("/my/printing-business");
  };
  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: t("myPage"), path: "/my" },
          {
            name: t("printing.title"),
            path: "/my/printing-business",
          },
        ]}
        title={t("printing.title")}
        enableLast
      />
      <Card outline gap={20}>
        <PrintingProgress
          status={PromotionalPrintingOrderStatusEnum.Received}
        />
        <PrintingDetailFrame />
      </Card>
      <Button style={{ width: "max-content" }} onClick={onClick}>
        {t("backToList")}
      </Button>
    </FlexWrapper>
  );
};

export default MyPrintingDetail;
