import React from "react";

import { ApiSem001ResponseOK } from "@clubs/interface/api/semester/apiSem001";
import { ApiSem012ResponseOK } from "@clubs/interface/api/semester/apiSem012";

import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";

import ActivityDurationTable from "./ActivityDurationTable";

interface ActivityDurationSectionProps {
  semester: ApiSem001ResponseOK["semesters"][number];
  durations: ApiSem012ResponseOK["activityDurations"];
}

const ActivityDurationSection: React.FC<ActivityDurationSectionProps> = ({
  semester,
  durations,
}) => (
  <FoldableSection
    key={semester.id}
    title={`${semester.year}년 ${semester.name}`}
    childrenMargin="20px"
  >
    <ActivityDurationTable durations={durations} />
  </FoldableSection>
);

export default ActivityDurationSection;
