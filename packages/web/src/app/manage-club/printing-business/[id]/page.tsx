"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { PromotionalPrintingOrderStatusEnum } from "@clubs/interface/common/enum/promotionalPrinting.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import PrintingProgress from "@sparcs-clubs/web/features/printing-business/components/PrintingProgress";
import ManagePrintingDetailFrame from "@sparcs-clubs/web/features/printing-business/frames/PrintingDetailFrame";

const ManagePrintingDetail = () => {
  const router = useRouter();
  const onClick = () => {
    router.push("/manage-club/printing-business");
  };
  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          {
            name: "홍보물 인쇄 내역",
            path: "/manage-club/printing-business",
          },
        ]}
        title="홍보물 인쇄 내역"
        enableLast
      />
      <Card outline gap={20}>
        <PrintingProgress
          status={PromotionalPrintingOrderStatusEnum.Received}
        />
        <ManagePrintingDetailFrame />
      </Card>
      <Button style={{ width: "max-content" }} onClick={onClick}>
        목록으로 돌아가기
      </Button>
    </FlexWrapper>
  );
};

export default ManagePrintingDetail;
