"use client";

import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { ClubDetailProps } from "@sparcs-clubs/web/features/clubs/components/ClubDetailCard";

import ClubDetailInfoFrame from "./ClubDetailInfoFrame";

const ClubDetailStudentFrame: React.FC<ClubDetailProps> = ({ club }) => (
  <FlexWrapper direction="column" gap={60}>
    <PageHead
      items={[
        { name: "동아리 목록", path: "/clubs" },
        { name: club.nameKr, path: `/clubs/${club.id}` },
      ]}
      title={club.nameKr}
    />
    <ClubDetailInfoFrame club={club} isRegistrationPeriod={false} />
  </FlexWrapper>
);

export default ClubDetailStudentFrame;
