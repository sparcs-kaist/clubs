import React from "react";

import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";
import { formatActivityDurationSemesterName } from "@sparcs-clubs/web/features/executive/utils/activityDuration";

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
      title={formatActivityDurationSemesterName(activityDuration)}
      childrenMargin="20px"
    >
      <ActivityDeadlineTable deadlines={deadlines} />
    </FoldableSection>
  );
};

export default ActivityDeadlineSection;
