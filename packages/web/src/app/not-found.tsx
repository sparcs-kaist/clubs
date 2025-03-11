"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NotFound: NextPage = () => {
  const Message = (
    <ErrorMessage>
      현재 접근한 페이지는
      <br />
      존재하지 않습니다
    </ErrorMessage>
  );

  const router = useRouter();

  const goToMain = () => {
    router.push("/");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[
        {
          text: "메인 바로가기",
          onClick: goToMain,
        },
      ]}
    />
  );
};

export default NotFound;
