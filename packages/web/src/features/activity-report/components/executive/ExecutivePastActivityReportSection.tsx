import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useGetExecutiveClubActivities from "@sparcs-clubs/web/features/activity-report/hooks/useGetExecutiveClubActivities";
import formatActivityDurationName, {
  defaultActivityDuration,
} from "@sparcs-clubs/web/features/activity-report/utils/formatActivityDurationName";

import ExecutiveClubActivitiesTable from "./ExecutiveClubActivitiesTable";

interface ExecutiveCurrentActivityReportSectionProps {
  clubId: string;
}

const ExecutivePastActivityReportSection: React.FC<
  ExecutiveCurrentActivityReportSectionProps
> = ({ clubId }) => {
  const {
    data: dataList,
    isLoading,
    isError,
  } = useGetExecutiveClubActivities(+clubId);

  return (
    <FoldableSectionTitle title="과거 활동 보고서" childrenMargin="30px">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper direction="column" gap={30}>
          {dataList.length === 0 && (
            <Typography color="GRAY.300" fs={16} lh={24}>
              과거 활동 보고서 내역이 없습니다
            </Typography>
          )}
          {dataList.map(data => (
            <FoldableSection
              key={data.activityDuration.id}
              title={`${formatActivityDurationName(data.activities?.activityDuration ?? data.activityDuration)} (총 ${data.activities?.items ? data.activities.items.length : 0}개)`}
              childrenMargin="20px"
            >
              {data.activities == null ? (
                <AsyncBoundary isLoading={false} isError />
              ) : (
                <ExecutiveClubActivitiesTable
                  data={
                    data?.activities
                      ? data.activities
                      : { activityDuration: defaultActivityDuration, items: [] }
                  }
                  isPast
                />
              )}
            </FoldableSection>
          ))}
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default ExecutivePastActivityReportSection;
