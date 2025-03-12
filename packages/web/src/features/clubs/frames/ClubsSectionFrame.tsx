"use client";

import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import ClubListGrid from "@sparcs-clubs/web/features/clubs/components/ClubListGrid";

import { ClubDetail } from "../types";

type ClubsSectionFrameProps = {
  showLength?: boolean; // section title에 길이 보여줄지 여부
  title: string; // 분과
  clubList: ClubDetail[];
  isRegistrationPeriod?: boolean;
};

const ClubsSectionFrame: React.FC<ClubsSectionFrameProps> = ({
  showLength = true,
  title,
  clubList,
  isRegistrationPeriod = false,
}) => (
  <FlexWrapper direction="column" gap={20}>
    <FoldableSectionTitle
      title={`${title} ${showLength ? `(${clubList.length})` : ""}`}
    >
      <ClubListGrid
        clubList={clubList}
        isRegistrationPeriod={isRegistrationPeriod}
      />
    </FoldableSectionTitle>
  </FlexWrapper>
);

export default ClubsSectionFrame;
