import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

import ExecutiveCurrentFundingSection from "../components/ExecutiveCurrentFundingSection";
import ExecutivePastFundingSection from "../components/ExecutivePastFundingSection";

const ExecutiveFundingClubFrame: React.FC<{
  clubId: string;
}> = ({ clubId }) => (
  <FlexWrapper direction="column" gap={60}>
    <ExecutiveCurrentFundingSection clubId={clubId} />
    <ExecutivePastFundingSection clubId={clubId} />
  </FlexWrapper>
);

export default ExecutiveFundingClubFrame;
