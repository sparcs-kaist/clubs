import { overlay } from "overlay-kit";
import React, { useCallback, useEffect, useState } from "react";

import { ActivityStatusEnum } from "@clubs/domain/activity/activity";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import useGetExecutiveClubActivitiesForDuration from "@sparcs-clubs/web/features/activity-report/services/executive/useGetExecutiveClubActivitiesForDuration";

import ActivityReportStatistic from "./ActivityReportStatistic";
import ChargedChangeActivityModalContent from "./ChargedChangeActivityModalContent";
import { ChargedChangeActivityProps } from "./ChargedChangeActivityModalTable";
import ExecutiveClubActivitiesTable from "./ExecutiveClubActivitiesTable";

interface ExecutiveCurrentActivityReportSectionProps {
  clubId: string;
}

const ExecutiveCurrentActivityReportSection: React.FC<
  ExecutiveCurrentActivityReportSectionProps
> = ({ clubId }) => {
  const [searchText, setSearchText] = useState<string>("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [selectedActivityInfos, setSelectedActivityInfos] = useState<
    ChargedChangeActivityProps[]
  >([]);

  const { data, isLoading, isError } = useGetExecutiveClubActivitiesForDuration(
    {
      clubId: Number(clubId),
    },
  );

  useEffect(() => {
    if (data) {
      setSelectedActivityInfos(
        data.items
          .filter(item => selectedActivityIds.includes(item.activityId))
          .map(item => ({
            activityId: item.activityId,
            activityName: item.activityName,
            prevExecutiveName: item.chargedExecutive?.name ?? "",
          })),
      );
    }
  }, [data, selectedActivityIds]);

  const openChangeModal = useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <ChargedChangeActivityModalContent
        isOpen={isOpen}
        close={() => {
          setSelectedActivityIds([]);
          close();
        }}
        selectedActivityIds={selectedActivityIds}
        selectedActivityInfos={selectedActivityInfos}
      />
    ));
  }, [selectedActivityIds, selectedActivityInfos]);

  return (
    <FoldableSectionTitle childrenMargin="30px" title="신규 활동 보고서">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper direction="column" gap={20}>
          {data?.items && data.items.length > 0 && (
            <>
              <ActivityReportStatistic
                pendingTotalCount={
                  data?.items.filter(
                    i => i.activityStatusEnum === ActivityStatusEnum.Applied,
                  ).length ?? 0
                }
                approvedTotalCount={
                  data?.items.filter(
                    i => i.activityStatusEnum === ActivityStatusEnum.Approved,
                  ).length ?? 0
                }
                rejectedTotalCount={
                  data?.items.filter(
                    i => i.activityStatusEnum === ActivityStatusEnum.Rejected,
                  ).length ?? 0
                }
                withApprovedRate
                chargedExecutiveName={data?.chargedExecutive?.name}
                withChargedExecutive
              />
              <FlexWrapper direction="row" gap={16}>
                <SearchInput
                  searchText={searchText}
                  handleChange={setSearchText}
                  placeholder=""
                />
                <Button
                  type={
                    selectedActivityIds.length === 0 ? "disabled" : "default"
                  }
                  onClick={openChangeModal}
                >
                  담당자 변경
                </Button>
              </FlexWrapper>
            </>
          )}
          <ExecutiveClubActivitiesTable
            data={data?.items ? data : { items: [] }}
            searchText={searchText}
            selectedActivityIds={selectedActivityIds}
            setSelectedActivityIds={setSelectedActivityIds}
          />
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default ExecutiveCurrentActivityReportSection;
