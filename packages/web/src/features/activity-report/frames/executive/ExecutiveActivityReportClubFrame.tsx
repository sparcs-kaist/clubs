import { overlay } from "overlay-kit";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityTerm } from "web/src/features/activity-report/types/activityTerm";

import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import ActivityReportStatistic from "@sparcs-clubs/web/features/activity-report/components/executive/ActivityReportStatistic";
import ChargedChangeActivityModalContent from "@sparcs-clubs/web/features/activity-report/components/executive/ChargedChangeActivityModalContent";
import { ChargedChangeActivityProps } from "@sparcs-clubs/web/features/activity-report/components/executive/ChargedChangeActivityModalTable";
import ExecutiveClubActivitiesTable from "@sparcs-clubs/web/features/activity-report/components/executive/ExecutiveClubActivitiesTable";
import useGetExecutiveClubActivities from "@sparcs-clubs/web/features/activity-report/services/executive/useGetExecutiveClubActivities";

const ExecutiveActivityReportClubFrame: React.FC<{
  clubId: string;
  semesters: ActivityTerm[];
}> = ({ clubId, semesters }) => {
  const [searchText, setSearchText] = useState<string>("");
  const semesterDataQueries = semesters.map(s =>
    useGetExecutiveClubActivities({
      clubId: Number(clubId),
      semesterId: s.id,
    }),
  );

  const isLoading = semesterDataQueries.some(q => q.isLoading);
  const isError = semesterDataQueries.some(q => q.isError);
  const dataList = semesterDataQueries.map(q => q.data ?? { items: [] });

  const [selectedActivityIdsBySemester, setSelectedActivityIdsBySemester] =
    useState<Record<number, number[]>>({});
  const [selectedActivityInfosBySemester, setSelectedActivityInfosBySemester] =
    useState<Record<number, ChargedChangeActivityProps[]>>({});
  useEffect(() => {
    semesters.forEach((sem, idx) => {
      const { items } = dataList[idx];
      const sel = selectedActivityIdsBySemester[sem.id] ?? [];
      setSelectedActivityInfosBySemester(prev => ({
        ...prev,
        [sem.id]: items
          .filter(i => sel.includes(i.activityId))
          .map(i => ({
            activityId: i.activityId,
            activityName: i.activityName,
            prevExecutiveName: i.chargedExecutive?.name ?? "",
          })),
      }));
    });
  }, [dataList, selectedActivityIdsBySemester, semesters]);

  const allData = useMemo(() => dataList.flatMap(d => d.items), [dataList]);

  const chargedExecutiveName = useMemo(() => {
    const first = semesterDataQueries.find(
      q => q.data && q.data.chargedExecutive,
    );
    return first?.data?.chargedExecutive?.name;
  }, [semesterDataQueries]);

  const globalSelectedIds = useMemo(
    () => Object.values(selectedActivityIdsBySemester).flat(),
    [selectedActivityIdsBySemester],
  );
  const globalSelectedInfos = useMemo(
    () => Object.values(selectedActivityInfosBySemester).flat(),
    [selectedActivityInfosBySemester],
  );

  const openChangeModal = () => {
    overlay.open(({ isOpen, close }) => (
      <ChargedChangeActivityModalContent
        isOpen={isOpen}
        close={close}
        selectedActivityIds={globalSelectedIds}
        selectedActivityInfos={globalSelectedInfos}
      />
    ));
  };

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <ActivityReportStatistic
        pendingTotalCount={
          allData.filter(
            i => i.activityStatusEnum === ActivityStatusEnum.Applied,
          ).length ?? 0
        }
        approvedTotalCount={
          allData.filter(
            i => i.activityStatusEnum === ActivityStatusEnum.Approved,
          ).length ?? 0
        }
        rejectedTotalCount={
          allData.filter(
            i => i.activityStatusEnum === ActivityStatusEnum.Rejected,
          ).length ?? 0
        }
        withApprovedRate
        chargedExecutiveName={chargedExecutiveName}
        withChargedExecutive
      />
      <FlexWrapper direction="row" gap={16}>
        <SearchInput
          searchText={searchText}
          handleChange={setSearchText}
          placeholder=""
        />
        <Button
          type={globalSelectedIds.length === 0 ? "disabled" : "default"}
          onClick={openChangeModal}
        >
          담당자 변경
        </Button>
      </FlexWrapper>
      {semesters.map((sem, idx) => (
        <section key={sem.id} style={{ marginTop: 32 }}>
          <FoldableSection
            key={sem.id}
            title={`${sem.year}년 ${sem.name}학기 (총 ${dataList[idx].items.length}개)`}
          >
            <ExecutiveClubActivitiesTable
              data={dataList[idx]}
              searchText={searchText}
              selectedActivityIds={selectedActivityIdsBySemester[sem.id] ?? []}
              setSelectedActivityIds={ids =>
                setSelectedActivityIdsBySemester(prev => ({
                  ...prev,
                  [sem.id]: ids,
                }))
              }
            />
          </FoldableSection>
        </section>
      ))}
    </AsyncBoundary>
  );
};

export default ExecutiveActivityReportClubFrame;
