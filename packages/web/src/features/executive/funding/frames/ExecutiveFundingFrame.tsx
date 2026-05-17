import { overlay } from "overlay-kit";
import { useEffect, useState } from "react";

import { ApiFnd008ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd008";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";

import ChargedChangeFundingModalContent from "../components/ChargedChangeFundingClubModalContent";
import { ChargedChangeFundingProps } from "../components/ChargedChangeFundingModalTable";
import ExecutiveFundingChargedTable from "../components/ExecutiveFundingChargedTable";
import ExecutiveFundingClubTable from "../components/ExecutiveFundingClubTable";
import FundingStatistic from "../components/FundingStatistic";
import useGetExecutiveFundings from "../services/useGetExecutiveFundings";
import { defaultActivityDuration } from "../utils/formatActivityDuration";

interface ExecutiveFundingFrameProps {
  semesterId?: number;
}

const defaultExecutiveFundingData: ApiFnd008ResponseOk = {
  activityDuration: defaultActivityDuration,
  totalCount: 0,
  appliedCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  committeeCount: 0,
  partialCount: 0,
  clubs: [],
  executives: [],
};

interface ExecutiveFundingContentProps {
  data: ApiFnd008ResponseOk;
}

export const ExecutiveFundingContent = ({
  data,
}: ExecutiveFundingContentProps) => {
  const [isClubView, setIsClubView] = useState<boolean>(
    window.history.state.isClubView ?? true,
  );
  const [searchText, setSearchText] = useState<string>("");
  const [selectedClubIds, setSelectedClubIds] = useState<number[]>([]);
  const [selectedClubInfos, setSelectedClubInfos] = useState<
    ChargedChangeFundingProps[]
  >([]);

  useEffect(() => {
    window.history.replaceState({ isClubView }, "");
  }, [isClubView]);

  useEffect(() => {
    setSelectedClubInfos(
      data.clubs
        .filter(club => selectedClubIds.includes(club.id))
        .map(club => ({
          clubId: club.id,
          clubNameKr: club.name,
          clubNameEn: club.name,
          prevExecutiveName: club.chargedExecutive?.name ?? "",
        })),
    );
  }, [data, selectedClubIds]);

  const openChargedChangeModal = () => {
    overlay.open(({ isOpen, close }) => (
      <ChargedChangeFundingModalContent
        isOpen={isOpen}
        close={close}
        selectedClubIds={selectedClubIds}
        selectedClubInfos={selectedClubInfos}
      />
    ));
  };

  return (
    <>
      <FundingStatistic fundings={data} />
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
          placeholder="검색어를 입력하세요"
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
        <ExecutiveFundingClubTable
          fundings={data}
          searchText={searchText}
          selectedClubIds={selectedClubIds}
          setSelectedClubIds={setSelectedClubIds}
        />
      ) : (
        <ExecutiveFundingChargedTable fundings={data} searchText={searchText} />
      )}
    </>
  );
};

const ExecutiveFundingFrame = ({ semesterId }: ExecutiveFundingFrameProps) => {
  const { data, isLoading, isError } = useGetExecutiveFundings({
    semesterId,
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <ExecutiveFundingContent data={data ?? defaultExecutiveFundingData} />
    </AsyncBoundary>
  );
};

export { defaultExecutiveFundingData };

export default ExecutiveFundingFrame;
