import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import useGetExecutiveClubActivities from "@sparcs-clubs/web/features/activity-report/hooks/useGetExecutiveClubActivities";

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
          {dataList.map(data => (
            <FoldableSection
              key={data.term.id}
              title={`${data.term.year}년 ${data.term.name}학기 (총 ${data.activities?.items ? data.activities.items.length : 0}개)`}
              childrenMargin="20px"
            >
              {data.activities == null ? (
                <AsyncBoundary isLoading={false} isError />
              ) : (
                <ExecutiveClubActivitiesTable
                  data={data?.activities ? data.activities : { items: [] }}
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
