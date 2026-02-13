import React, { useMemo } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";
import useGetActivityDurations from "@sparcs-clubs/web/features/executive/services/useGetActivityDurations";

import ActivityDurationSection from "./ActivityDurationSection";

const ActivityDurationSectionList: React.FC = () => {
  const {
    data: semestersData,
    isLoading: isSemestersLoading,
    isError: isSemestersError,
  } = useGetSemesters({ pageOffset: 1, itemCount: 100 });

  const {
    data: durationsData,
    isLoading: isDurationsLoading,
    isError: isDurationsError,
  } = useGetActivityDurations();

  const isLoading = isSemestersLoading || isDurationsLoading;
  const isError = isSemestersError || isDurationsError;

  const groupedData = useMemo(() => {
    if (!semestersData?.semesters || !durationsData?.activityDurations)
      return [];

    type DurationItem = (typeof durationsData.activityDurations)[number];
    const durationsBySemester: Map<number, DurationItem[]> = new Map();
    durationsData.activityDurations.forEach(d => {
      const list = durationsBySemester.get(d.semester.id) || [];
      list.push(d);
      durationsBySemester.set(d.semester.id, list);
    });

    return [...semestersData.semesters]
      .sort((a, b) => b.id - a.id)
      .map(semester => ({
        semester,
        durations: durationsBySemester.get(semester.id) || [],
      }));
  }, [semestersData, durationsData]);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={30}>
        {groupedData.map(({ semester, durations }) => (
          <ActivityDurationSection
            key={semester.id}
            semester={semester}
            durations={durations}
          />
        ))}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ActivityDurationSectionList;
