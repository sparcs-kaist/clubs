"use client";

import Link from "next/link";
import React from "react";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NotIamLogin: React.FC = () => {
  const Message = (
    <ErrorMessage>
      Oops!
      <br />
      Clubs에 로그인 하는 중에 문제가 발생했습니다.
      <br />
      아래와 같은 원인에 의해 문제가 발생했을 수 있습니다.
      <br />
      - SPARCS SSO 에 KAIST IAM이 아닌 계정으로 로그인 하였음.
      <br />
      SPARCS SSO 에서 로그아웃 하신 후에 KAIST IAM (통합인증)으로
      로그인해보세요.
      <br />
      로그인 과정이 지연되어서 토큰이 만료됨. SPARCS SSO 에서 로그아웃 하신 후에
      다시 로그인해보세요.
      <br />
      문제가 반복될 경우 clubs@sparcs.org로 문의 부탁드립니다🙇🏻‍♂️
      <br />
      <Link href="https://sparcssso.kaist.ac.kr/">SPARCS SSO 바로가기👈</Link>
    </ErrorMessage>
  );

  return <ErrorPageTemplate message={Message} buttons={[]} />;
};
export default NotIamLogin;
