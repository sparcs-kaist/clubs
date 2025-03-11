"use client";

import React from "react";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

interface LoginRequiredProps {
  login: () => void;
}

const LoginRequired: React.FC<LoginRequiredProps> = ({ login }) => {
  const Message = (
    <ErrorMessage>
      현재 접근한 페이지는
      <br />
      로그인해야 볼 수 있습니다
    </ErrorMessage>
  );

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[{ text: "로그인 바로가기", onClick: login }]}
    />
  );
};

export default LoginRequired;
