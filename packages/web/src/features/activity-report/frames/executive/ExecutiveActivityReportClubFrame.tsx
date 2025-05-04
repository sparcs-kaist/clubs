import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import ExecutiveCurrentActivityReportSection from "@sparcs-clubs/web/features/activity-report/components/executive/ExecutiveCurrentActivityReportSection";
import ExecutivePastActivityReportSection from "@sparcs-clubs/web/features/activity-report/components/executive/ExecutivePastActivityReportSection";

const ExecutiveActivityReportClubFrame: React.FC<{
  clubId: string;
}> = ({ clubId }) => (
  <FlexWrapper direction="column" gap={60}>
    <ExecutiveCurrentActivityReportSection clubId={clubId} />
    <ExecutivePastActivityReportSection clubId={clubId} />
  </FlexWrapper>
);

export default ExecutiveActivityReportClubFrame;
