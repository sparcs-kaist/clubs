import React, { useMemo } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import useGetSemesters from "@sparcs-clubs/web/common/services/getSemesters";

import useGetRegistrationDeadlines from "../services/useGetRegistrationDeadlines";
import RegistrationDeadlineSection from "./RegistrationDeadlineSection";

const RegistrationDeadlineSectionList: React.FC = () => {
  const {
    data: semestersData,
    isLoading: isSemestersLoading,
    isError: isSemestersError,
  } = useGetSemesters({ pageOffset: 1, itemCount: 100 });

  const {
    data: deadlinesData,
    isLoading: isDeadlinesLoading,
    isError: isDeadlinesError,
  } = useGetRegistrationDeadlines();

  const isLoading = isSemestersLoading || isDeadlinesLoading;
  const isError = isSemestersError || isDeadlinesError;

  const groupedData = useMemo(() => {
    if (!semestersData?.semesters || !deadlinesData?.deadlines) return [];

    type DeadlineItem = (typeof deadlinesData.deadlines)[number];
    const deadlinesBySemester: Map<number, DeadlineItem[]> = new Map();
    deadlinesData.deadlines.forEach(d => {
      const list = deadlinesBySemester.get(d.semesterId) || [];
      list.push(d);
      deadlinesBySemester.set(d.semesterId, list);
    });

    return [...semestersData.semesters]
      .sort((a, b) => b.id - a.id)
      .map(semester => ({
        semester,
        deadlines: deadlinesBySemester.get(semester.id) || [],
      }));
  }, [semestersData, deadlinesData]);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={30}>
        {groupedData.map(({ semester, deadlines }) => (
          <RegistrationDeadlineSection
            key={semester.id}
            semester={semester}
            deadlines={deadlines}
          />
        ))}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default RegistrationDeadlineSectionList;
