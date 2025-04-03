"use client";

// import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import React from "react";
// import Link from "next/link";
import styled from "styled-components";

// import paths from "@sparcs-clubs/web/constants/paths";
import MoreSectionTitle from "../components/MoreSectionTitle";
// import ServiceCard from "../components/ServiceCard";

const ServiceSectionFrameInner = styled.div`
  display: flex;
  flex-direction: column;
  width: 320px;
  gap: 20px;

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.lg}) {
    width: 640px;
  }

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.md}) {
    width: 560px;
  }

  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    width: 100%;
  }
`;

const ServiceCardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: 24px;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    gap: 8px;
    margin-left: 16px;
  }
`;

const ServiceSectionFrame: React.FC = () => (
  <ServiceSectionFrameInner>
    <MoreSectionTitle title="서비스 신청" />
    <ServiceCardWrapper>
      {/* <Link
        href={paths.SERVICE.sub[0].path}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <ServiceCard serviceTitle="대여 사업" serviceLink="" />
      </Link>
      <Link
        href={paths.SERVICE.sub[1].path}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <ServiceCard serviceTitle="홍보물 인쇄" serviceLink="" />
      </Link>
      <Link
        href={paths.SERVICE.sub[2].path}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <ServiceCard serviceTitle="활동확인서 발급 신청" serviceLink="" />
      </Link>
      <Link
        href={paths.SERVICE.sub[3].path}
        style={{ display: "flex", flexDirection: "column" }}
      >
        <ServiceCard serviceTitle="공용공간 비정기사용신청" serviceLink="" />
      </Link> */}
    </ServiceCardWrapper>
  </ServiceSectionFrameInner>
);

export default ServiceSectionFrame;
