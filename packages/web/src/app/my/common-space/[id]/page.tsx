"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { CommonSpaceUsageOrderStatusEnum } from "@clubs/interface/common/enum/commonSpace.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import CommonSpaceProgress from "@sparcs-clubs/web/features/common-space/components/CommonSpaceProgress";
import CommonSpaceDetailFrame from "@sparcs-clubs/web/features/common-space/frames/CommonSpaceDetailFrame";

const MyCommonSpaceDetail = () => {
  const router = useRouter();
  const onClick = () => {
    router.push("/my/common-space");
  };
  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "마이페이지", path: "/my" },
          {
            name: "공용공간 비정기사용 내역",
            path: "/my/common-space",
          },
        ]}
        title="공용공간 비정기사용 내역"
        enableLast
      />
      <Card outline gap={20}>
        <CommonSpaceProgress status={CommonSpaceUsageOrderStatusEnum.Applied} />
        <CommonSpaceDetailFrame />
      </Card>
      <Button style={{ width: "max-content" }} onClick={onClick}>
        목록으로 돌아가기
      </Button>
    </FlexWrapper>
  );
};

export default MyCommonSpaceDetail;
