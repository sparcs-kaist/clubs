import { useParams } from "next/navigation";
import React from "react";

import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";

import ActivityReportChargedClubTable from "../components/ActivityReportChargedClubTable";
import ActivityReportChargedOtherTable from "../components/ActivityReportChargedOtherTable";
import ActivityReportStatistic from "../components/ActivityReportStatistic";
import useGetExecutiveChargedActivities from "../services/useGetExecutiveChargedActivities";

const ExecutiveActivityReportChargedFrame: React.FC = () => {
  const { id: executiveId } = useParams();
  const { data, isLoading, isError } = useGetExecutiveChargedActivities({
    executiveId: Number(executiveId),
  });

  window.history.replaceState({ isClubView: false }, "");

  const clubsActivities = data?.activities.reduce(
    (acc, activity) => {
      if (!activity.club?.id || !activity.chargedExecutive?.id) {
        return acc;
      }

      const newAcc = { ...acc };
      if (activity.chargedExecutive.id === data.chargedExecutive.id) {
        const clubId = activity.club.id;
        if (!newAcc[clubId]) {
          newAcc[clubId] = [];
        }
        newAcc[clubId].push(activity);
      }
      return newAcc;
    },
    {} as Record<number, typeof data.activities>,
  );

  const otherActivities = data?.activities.filter(
    activity => activity.chargedExecutive?.id !== data.chargedExecutive.id,
  );

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={40}>
        <PageHead
          items={[
            { name: "집행부원 대시보드", path: "/executive" },
            {
              name: "활동 보고서 작성 내역",
              path: `/executive/activity-report`,
            },
          ]}
          title={`활동 보고서 검토 내역 (${data?.chargedExecutive.name.trim()})`}
          enableLast
        />
        <ActivityReportStatistic
          pendingTotalCount={
            data?.activities.filter(
              activity =>
                activity.activityStatusEnum === ActivityStatusEnum.Applied,
            ).length ?? 0
          }
          approvedTotalCount={
            data?.activities.filter(
              activity =>
                activity.activityStatusEnum === ActivityStatusEnum.Approved,
            ).length ?? 0
          }
          rejectedTotalCount={
            data?.activities.filter(
              activity =>
                activity.activityStatusEnum === ActivityStatusEnum.Rejected,
            ).length ?? 0
          }
        />
        {clubsActivities &&
          Object.entries(clubsActivities).map(([clubId, activities]) => (
            <ActivityReportChargedClubTable
              key={clubId}
              activities={activities ?? []}
            />
          ))}
        {otherActivities && otherActivities.length > 0 && (
          <ActivityReportChargedOtherTable activities={otherActivities} />
        )}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveActivityReportChargedFrame;
