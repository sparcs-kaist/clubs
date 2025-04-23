import React from "react";

import { ApiAct028ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct028";
import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

import ActivityReportStatisticContent from "./_atomic/ActivityReportStatisticContent";

const ActivityReportChargedStatistic: React.FC<{
  activities: ApiAct028ResponseOk["activities"];
}> = ({ activities }) => {
  const pendingTotalCount = activities.filter(
    activity => activity.activityStatusEnum === ActivityStatusEnum.Applied,
  ).length;
  const approvedTotalCount = activities.filter(
    activity => activity.activityStatusEnum === ActivityStatusEnum.Approved,
  ).length;
  const rejectedTotalCount = activities.filter(
    activity => activity.activityStatusEnum === ActivityStatusEnum.Rejected,
  ).length;

  return (
    <ActivityReportStatisticContent
      pendingTotalCount={pendingTotalCount}
      approvedTotalCount={approvedTotalCount}
      rejectedTotalCount={rejectedTotalCount}
    />
  );
};

export default ActivityReportChargedStatistic;
