"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

import { CommonSpaceUsageOrderStatusEnum } from "@clubs/interface/common/enum/commonSpace.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import CommonSpaceProgress from "@sparcs-clubs/web/features/common-space/components/CommonSpaceProgress";
import CommonSpaceDetailFrame from "@sparcs-clubs/web/features/common-space/frames/CommonSpaceDetailFrame";

const MyCommonSpaceDetail = () => {
  const t = useTranslations("my.services");
  const router = useRouter();
  const onClick = () => {
    router.push("/my/common-space");
  };
  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: t("myPage"), path: "/my" },
          {
            name: t("commonSpace.title"),
            path: "/my/common-space",
          },
        ]}
        title={t("commonSpace.title")}
        enableLast
      />
      <Card outline gap={20}>
        <CommonSpaceProgress status={CommonSpaceUsageOrderStatusEnum.Applied} />
        <CommonSpaceDetailFrame />
      </Card>
      <Button style={{ width: "max-content" }} onClick={onClick}>
        {t("backToList")}
      </Button>
    </FlexWrapper>
  );
};

export default MyCommonSpaceDetail;
