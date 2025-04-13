"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import MyActivityCertificateProgress from "@sparcs-clubs/web/features/activity-certificate/components/MyActivityCertificateProgress";
import ActivityCertificateDetailFrame from "@sparcs-clubs/web/features/activity-certificate/frames/ActivityCertificateDetailFrame";

const MyAcfDetail = () => {
  const router = useRouter();
  const onClick = () => {
    router.push("/my/activity-certificate");
  };
  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "마이페이지", path: "/my" },
          {
            name: "활동확인서 발급 내역",
            path: "/my/activity-certificate",
          },
        ]}
        title="활동확인서 발급 내역"
        enableLast
      />
      <Card outline gap={20}>
        <MyActivityCertificateProgress
          status={ActivityCertificateOrderStatusEnum.Rejected}
        />
        <ActivityCertificateDetailFrame />
      </Card>
      <Button style={{ width: "max-content" }} onClick={onClick}>
        목록으로 돌아가기
      </Button>
    </FlexWrapper>
  );
};

export default MyAcfDetail;
