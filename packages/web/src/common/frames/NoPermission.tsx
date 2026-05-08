"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NoPermission: NextPage = () => {
  const router = useRouter();

  const Message = (
    <ErrorMessage>
      현재 페이지에 대한
      <br />
      접근 권한이 없습니다
    </ErrorMessage>
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

export default NoPermission;
