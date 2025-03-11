"use client";

import { useRouter } from "next/navigation";
import React from "react";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const HasClubRegistration: React.FC<{
  applyId?: number;
  errorMessage?: string;
}> = ({ applyId = undefined, errorMessage = undefined }) => {
  const router = useRouter();

  const Message = (
    <ErrorMessage style={{ whiteSpace: "pre-line" }}>
      {errorMessage ||
        `동아리 등록 신청 내역이 이미 존재하여 \n 추가로 신청할 수 없습니다`}
    </ErrorMessage>
  );

  const goToMain = () => {
    router.push("/");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={
        applyId
          ? [
              { text: "메인 바로가기", onClick: goToMain },
              {
                text: "동아리 등록 신청 내역 바로가기",
                onClick: () => router.push(`/my/register-club/${applyId}`),
              },
            ]
          : [{ text: "메인 바로가기", onClick: goToMain }]
      }
    />
  );
};

export default HasClubRegistration;
