"use client";

import React from "react";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NotIamLogin: React.FC = () => {
  const Message = (
    <ErrorMessage
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <Typography fs={24} lh={48} fw="BOLD">
        Clubs에 로그인 하는 중에 문제가 발생했습니다.
      </Typography>
      <FlexWrapper
        direction="row"
        gap={15}
        style={{ marginTop: 10, marginBottom: 15 }}
      >
        <div style={{ fontSize: 20 }}>⚠️</div>
        <FlexWrapper direction="column" style={{ alignItems: "flex-start" }}>
          <Typography fs={20} lh={48} fw="BOLD">
            예상 원인
          </Typography>
          <Typography fs={16} fw="MEDIUM">
            1. SPARCS SSO에{" "}
            <span style={{ fontWeight: 700 }}>KAIST IAM이 아닌 계정</span>으로
            로그인 한 경우
          </Typography>
          <Typography fs={16} fw="MEDIUM">
            2. 로그인 과정이 지연되어{" "}
            <span style={{ fontWeight: 700 }}>토큰이 만료</span>된 경우
          </Typography>
        </FlexWrapper>
      </FlexWrapper>
      <FlexWrapper direction="row" gap={15}>
        <div style={{ fontSize: 20 }}>🛠️</div>
        <FlexWrapper direction="column" style={{ alignItems: "flex-start" }}>
          <Typography fs={20} lh={48} fw="SEMIBOLD">
            해결 방법
          </Typography>
          <Typography fs={16} fw="MEDIUM">
            SPARCS SSO에서 로그아웃 하신 후,{" "}
            <span style={{ fontWeight: 700 }}>KAIST IAM (통합인증)</span>
            으로 다시 로그인해보세요.
          </Typography>
          <Typography fs={16} fw="MEDIUM">
            문제가 반복될 경우{" "}
            <span style={{ display: "inline-block" }}>
              <a href="mailto:clubs@sparcs.org">clubs@sparcs.org</a>
            </span>{" "}
            로 문의 부탁드립니다.
          </Typography>
        </FlexWrapper>
      </FlexWrapper>
    </ErrorMessage>
  );

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[
        {
          text: "SPARCS SSO 바로가기 👈",
          onClick: () => {
            window.location.href = "https://sparcssso.kaist.ac.kr/";
          },
        },
      ]}
    />
  );
};
export default NotIamLogin;
