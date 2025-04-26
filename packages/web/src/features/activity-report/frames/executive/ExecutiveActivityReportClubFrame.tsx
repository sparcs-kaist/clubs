import { overlay } from "overlay-kit";
import React, { useEffect, useMemo, useState } from "react";

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
import { ActivityTerm } from "@sparcs-clubs/web/features/activity-report/types/activityTerm";

const ExecutiveActivityReportClubFrame: React.FC<{
  clubId: string;
  activityTerms: ActivityTerm[];
}> = ({ clubId, activityTerms }) => {
  const [searchText, setSearchText] = useState<string>("");
  const activityDurationDataQueries = activityTerms.map(s =>
    useGetExecutiveClubActivities({
      clubId: Number(clubId),
      activityDurationId: s.id,
    }),
  );

  const isLoading = activityDurationDataQueries.some(q => q.isLoading);
  const isError = activityDurationDataQueries.some(q => q.isError);
  const dataList = activityDurationDataQueries.map(
    q => q.data ?? { items: [] },
  );

  const [selectedActivityIdsBySemester, setSelectedActivityIdsBySemester] =
    useState<Record<number, number[]>>({});
  const [selectedActivityInfosBySemester, setSelectedActivityInfosBySemester] =
    useState<Record<number, ChargedChangeActivityProps[]>>({});
  useEffect(() => {
    activityTerms.forEach((term, idx) => {
      const { items } = dataList[idx];
      const sel = selectedActivityIdsBySemester[term.id] ?? [];
      setSelectedActivityInfosBySemester(prev => ({
        ...prev,
        [term.id]: items
          .filter(i => sel.includes(i.activityId))
          .map(i => ({
            activityId: i.activityId,
            activityName: i.activityName,
            prevExecutiveName: i.chargedExecutive?.name ?? "",
          })),
      }));
    });
  }, [dataList, selectedActivityIdsBySemester, activityTerms]);

  const allData = useMemo(() => dataList.flatMap(d => d.items), [dataList]);

  const chargedExecutiveName = useMemo(() => {
    const first = activityDurationDataQueries.find(
      q => q.data && q.data.chargedExecutive,
    );
    return first?.data?.chargedExecutive?.name;
  }, [activityDurationDataQueries]);

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
      {activityTerms.map((term, idx) => (
        <section key={term.id} style={{ marginTop: 32 }}>
          <FoldableSection
            key={term.id}
            title={`${term.year}년 ${term.name}학기 (총 ${dataList[idx].items.length}개)`}
          >
            <ExecutiveClubActivitiesTable
              data={dataList[idx]}
              searchText={searchText}
              selectedActivityIds={selectedActivityIdsBySemester[term.id] ?? []}
              setSelectedActivityIds={ids =>
                setSelectedActivityIdsBySemester(prev => ({
                  ...prev,
                  [term.id]: ids,
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
