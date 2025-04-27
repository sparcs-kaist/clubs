"use client";

import { useRouter } from "next/navigation";
import React from "react";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

interface NotActivityReportPeriodProps {
  type?: "write" | "edit";
}

const NotActivityReportPeriod: React.FC<NotActivityReportPeriodProps> = ({
  type = "write",
}) => {
  const router = useRouter();

  const Message = (
    <ErrorMessage>{`현재는 활동보고서 ${type === "write" ? "작성" : "수정"} 기간이 아닙니다`}</ErrorMessage>
  );

  const goToMain = () => {
    router.push("/");
  };
  const goToActivityMainFrame = () => {
    router.push("/manage-club/activity-report");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[
        { text: "메인 바로가기", onClick: goToMain },
        {
          text: "활동 보고서 조회 페이지 바로가기",
          onClick: goToActivityMainFrame,
        },
      ]}
    />
  );
};

export default NotActivityReportPeriod;
