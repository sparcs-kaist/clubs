import { overlay } from "overlay-kit";
import React, { useEffect, useState } from "react";

import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";

import ActivityReportStatistic from "../components/ActivityReportStatistic";
import ChargedChangeActivityModalContent from "../components/ChargedChangeActivityModalContent";
import { ChargedChangeActivityProps } from "../components/ChargedChangeActivityModalTable";
import ExecutiveClubActivitiesTable from "../components/ExecutiveClubActivitiesTable";
import useGetExecutiveClubActivities from "../services/useGetExecutiveClubActivities";

const ExecutiveActivityReportClubFrame: React.FC<{ clubId: string }> = ({
  clubId,
}) => {
  const [searchText, setSearchText] = useState<string>("");
  const { data, isLoading, isError } = useGetExecutiveClubActivities({
    clubId: Number(clubId),
  });

  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);
  const [selectedActivityInfos, setSelectedActivityInfos] = useState<
    ChargedChangeActivityProps[]
  >([]);

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

  const openChargedChangeModal = () => {
    overlay.open(({ isOpen, close }) => (
      <ChargedChangeActivityModalContent
        isOpen={isOpen}
        close={close}
        selectedActivityIds={selectedActivityIds}
        selectedActivityInfos={selectedActivityInfos}
      />
    ));
  };

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <ActivityReportStatistic
        pendingTotalCount={
          data?.items.filter(
            item => item.activityStatusEnum === ActivityStatusEnum.Applied,
          ).length ?? 0
        }
        approvedTotalCount={
          data?.items.filter(
            item => item.activityStatusEnum === ActivityStatusEnum.Approved,
          ).length ?? 0
        }
        rejectedTotalCount={
          data?.items.filter(
            item => item.activityStatusEnum === ActivityStatusEnum.Rejected,
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
          type={selectedActivityIds.length === 0 ? "disabled" : "default"}
          onClick={openChargedChangeModal}
        >
          담당자 변경
        </Button>
      </FlexWrapper>
      <ExecutiveClubActivitiesTable
        data={data ?? { items: [] }}
        searchText={searchText}
        selectedActivityIds={selectedActivityIds}
        setSelectedActivityIds={setSelectedActivityIds}
      />
    </AsyncBoundary>
  );
};

export default ExecutiveActivityReportClubFrame;
