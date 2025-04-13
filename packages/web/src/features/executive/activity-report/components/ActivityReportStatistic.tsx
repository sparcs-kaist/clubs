import React from "react";

import { ApiAct023ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct023";

import ActivityReportStatisticContent from "./_atomic/ActivityReportStatisticContent";

interface ActivityReportStatisticProps {
  activities: ApiAct023ResponseOk;
}

const ActivityReportStatistic: React.FC<ActivityReportStatisticProps> = ({
  activities,
}) => {
  const pendingTotalCount = activities.items.reduce(
    (acc, item) => acc + item.pendingActivitiesCount,
    0,
  );
  const approvedTotalCount = activities.items.reduce(
    (acc, item) => acc + item.approvedActivitiesCount,
    0,
  );
  const rejectedTotalCount = activities.items.reduce(
    (acc, item) => acc + item.rejectedActivitiesCount,
    0,
  );

  return (
    <ActivityReportStatisticContent
      pendingTotalCount={pendingTotalCount}
      approvedTotalCount={approvedTotalCount}
      rejectedTotalCount={rejectedTotalCount}
    />
  );
};

export default ActivityReportStatistic;
