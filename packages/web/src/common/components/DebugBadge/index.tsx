"use client";

import React from "react";
import styled from "styled-components";

import { CLUBS_APP } from "@sparcs-clubs/web/constants/appInfo";

const Container = styled.div`
  pointer-events: none;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;
  overflow: hidden;
  height: 250px;
`;
const Badge = styled.div`
  pointer-events: none;
  height: 35px;
  font-size: 14px;

  background-color: red;
  color: white;
  transform: rotate(45deg);
  opacity: 0.2;
  width: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  top: 50px;
  right: -50px;

  text-align: center;
  line-height: 1;
`;
const BadgeBottom = styled.div`
  pointer-events: none;
  height: 20px;
  font-size: 14px;

  position: relative;
  top: 44px;
  right: -52px;

  width: 200px;

  /* background: grey; */

  transform: rotate(45deg);
  color: #cc0000;

  font-weight: bold;
  text-align: center;
  opacity: 0.1;
`;

const environment = (() => {
  switch (process.env.NEXT_PUBLIC_APP_MODE) {
    case "production":
      return null;
    case "stage":
      return "stage";
    case "demo":
      return "demo";
    case "dev":
    default:
      return "dev";
  }
})();

const MOCK_STATUS = process.env.NEXT_PUBLIC_API_MOCK_MODE
  ? "--mock=true"
  : "--mock=false";

const DebugBadge: React.FC = () => {
  const [date, setDate] = React.useState("loading");

  React.useEffect(() => {
    setDate(
      `${new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} ${new Date().toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" })}`,
    );
  });

  return (
    <Container>
      {environment && (
        <>
          <Badge>
            {`${CLUBS_APP.displayVersion} ${environment} ${MOCK_STATUS}`}
            <br />
            {process.env.NEXT_PUBLIC_BUILD_TIME || date}
          </Badge>
          <BadgeBottom>©️SPARCS AR-002 Internal</BadgeBottom>
        </>
      )}
    </Container>
  );
};

export default DebugBadge;
