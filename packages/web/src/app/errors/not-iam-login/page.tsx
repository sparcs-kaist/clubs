"use client";

import { useRouter } from "next/navigation";
import React from "react";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NotIamLogin: React.FC = () => {
  const Message = (
    <ErrorMessage>
      로그인 시 이메일 로그인이 아닌
      <br />
      IAM 로그인을 활용해 주세요
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
export default NotIamLogin;
