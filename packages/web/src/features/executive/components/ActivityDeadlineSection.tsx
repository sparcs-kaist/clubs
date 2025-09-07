import React from "react";

import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";

import { GroupedActivityDeadline } from "../hooks/useGroupActivityDeadlines";
import ActivityDeadlineTable from "./ActivityDeadlineTable";

interface ActivityDeadlineSectionProps {
  groupedDeadline: GroupedActivityDeadline;
}

const ActivityDeadlineSection: React.FC<ActivityDeadlineSectionProps> = ({
  groupedDeadline,
}) => {
  const { activityDuration, deadlines } = groupedDeadline;

  if (!deadlines || deadlines.length === 0) {
    return null;
  }

  return (
    <FoldableSection
      key={activityDuration.id}
      title={`${activityDuration.year}년 ${activityDuration.name} 활동기간`}
      childrenMargin="20px"
    >
      <ActivityDeadlineTable deadlines={deadlines} />
    </FoldableSection>
  );
};

export default ActivityDeadlineSection;
