"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NotClubRegistrationPeriod: NextPage = () => {
  const router = useRouter();

  const Message = (
    <ErrorMessage>현재는 동아리 등록 신청 기간이 아닙니다</ErrorMessage>
  );

  const goToMain = () => {
    router.push("/");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[{ text: "메인 바로가기", onClick: goToMain }]}
    />
  );
};

export default NotClubRegistrationPeriod;
