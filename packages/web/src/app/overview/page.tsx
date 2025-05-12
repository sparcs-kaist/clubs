"use client";

import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import OverviewFrame from "@sparcs-clubs/web/features/overview/frames/OverviewFrame";

const Overview: React.FC = () => (
  <FlexWrapper direction="column" gap={20}>
    <PageHead
      items={[{ name: "동아리 총람", path: "/overview" }]}
      title="동아리 총람"
    />
    <OverviewFrame />
  </FlexWrapper>
);

export default Overview;
