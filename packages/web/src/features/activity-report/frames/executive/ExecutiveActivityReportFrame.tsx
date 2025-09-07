import { overlay } from "overlay-kit";
import { useCallback, useEffect, useState } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import ActivityReportStatistic from "@sparcs-clubs/web/features/activity-report/components/executive/ActivityReportStatistic";
import ChargedChangeClubModalContent from "@sparcs-clubs/web/features/activity-report/components/executive/ChargedChangeClubModalContent";
import { ChargedChangeClubProps } from "@sparcs-clubs/web/features/activity-report/components/executive/ChargedChangeClubModalTable";
import ExecutiveActivityChargedTable from "@sparcs-clubs/web/features/activity-report/components/executive/ExecutiveActivityChargedTable";
import ExecutiveActivityClubTable from "@sparcs-clubs/web/features/activity-report/components/executive/ExecutiveActivityClubTable";
import useGetExecutiveActivities from "@sparcs-clubs/web/features/activity-report/services/executive/useGetExecutiveActivities";

const ExecutiveActivityReportFrame = () => {
  const [isClubView, setIsClubView] = useState<boolean>(
    window.history.state.isClubView ?? true,
  );
  const [searchText, setSearchText] = useState("");

  const [selectedClubIds, setSelectedClubIds] = useState<number[]>([]);
  const [selectedClubInfos, setSelectedClubInfos] = useState<
    ChargedChangeClubProps[]
  >([]);

  // TODO. 우선 급한대로 야매로 처리함 (추후에 페이지네이션 백에서 삭제하기)
  const { data, isLoading, isError } = useGetExecutiveActivities({
    pageOffset: 1,
    itemCount: 150,
  });

  useEffect(() => {
    window.history.replaceState({ isClubView }, "");
  }, [isClubView]);

  useEffect(() => {
    if (data) {
      setSelectedClubInfos(
        data.items
          .filter(item => selectedClubIds.includes(item.clubId))
          .map(item => ({
            clubId: item.clubId,
            clubNameKr: item.clubNameKr,
            clubNameEn: item.clubNameEn,
            prevExecutiveName: item.chargedExecutive?.name ?? "",
          })),
      );
    }
  }, [data, selectedClubIds]);

  const openChargedChangeModal = useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <ChargedChangeClubModalContent
        isOpen={isOpen}
        close={() => {
          setSelectedClubIds([]);
          close();
        }}
        selectedClubIds={selectedClubIds}
        selectedClubInfos={selectedClubInfos}
      />
    ));
  }, [selectedClubIds, selectedClubInfos]);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <ActivityReportStatistic
        pendingTotalCount={
          data?.items.reduce(
            (acc, item) => acc + item.pendingActivitiesCount,
            0,
          ) ?? 0
        }
        approvedTotalCount={
          data?.items.reduce(
            (acc, item) => acc + item.approvedActivitiesCount,
            0,
          ) ?? 0
        }
        rejectedTotalCount={
          data?.items.reduce(
            (acc, item) => acc + item.rejectedActivitiesCount,
            0,
          ) ?? 0
        }
      />
      <FlexWrapper direction="row" gap={12}>
        <Button
          style={{ flex: 1 }}
          type={isClubView ? "default" : "outlined"}
          onClick={() => setIsClubView(true)}
        >
          동아리별
        </Button>
        <Button
          style={{ flex: 1 }}
          type={isClubView ? "outlined" : "default"}
          onClick={() => setIsClubView(false)}
        >
          담당자별
        </Button>
      </FlexWrapper>
      <FlexWrapper direction="row" gap={16}>
        <SearchInput
          searchText={searchText}
          handleChange={setSearchText}
          placeholder={
            isClubView
              ? "동아리 이름을 입력해주세요"
              : "담당자 이름을 입력해주세요"
          }
        />
        {isClubView && (
          <Button
            onClick={openChargedChangeModal}
            type={selectedClubIds.length === 0 ? "disabled" : "default"}
          >
            담당자 변경
          </Button>
        )}
      </FlexWrapper>
      {isClubView ? (
        <ExecutiveActivityClubTable
          activities={data?.items}
          searchText={searchText}
          selectedClubIds={selectedClubIds}
          setSelectedClubIds={setSelectedClubIds}
        />
      ) : (
        <ExecutiveActivityChargedTable
          executives={data?.executiveProgresses}
          searchText={searchText}
        />
      )}
    </AsyncBoundary>
  );
};

export default ExecutiveActivityReportFrame;
