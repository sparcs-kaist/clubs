import React from "react";

import { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";
import { ApiSem016ResponseOk } from "@clubs/interface/api/semester/apiSem016";

import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";

import FundingDeadlineTable from "./FundingDeadlineTable";

interface FundingDeadlineSectionProps {
  activityDuration: ApiSem012ResponseOK["activityDurations"][number];
  fundingDeadlines: ApiSem016ResponseOk | undefined;
}

const FundingDeadlineSection: React.FC<FundingDeadlineSectionProps> = ({
  activityDuration,
  fundingDeadlines,
}) => {
  if (!fundingDeadlines || fundingDeadlines.deadlines.length === 0) {
    return null;
  }

  return (
    <FoldableSection
      key={activityDuration.id}
      title={`${activityDuration.year}년 ${activityDuration.name} 활동기간`}
      childrenMargin="20px"
    >
      <FundingDeadlineTable fundingDeadlines={fundingDeadlines} />
    </FoldableSection>
  );
};

export default FundingDeadlineSection;
