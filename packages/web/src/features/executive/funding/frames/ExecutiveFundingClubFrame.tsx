import { useParams } from "next/navigation";
import { overlay } from "overlay-kit";
import { useEffect, useState } from "react";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";
import { ChargedChangeFundingProps } from "@sparcs-clubs/web/features/executive/funding/components/ChargedChangeFundingModalTable";
import ExecutiveClubFundingsTable from "@sparcs-clubs/web/features/executive/funding/components/ExecutiveClubFundingsTable";
import FundingClubStatistic from "@sparcs-clubs/web/features/executive/funding/components/FundingClubStatistic";

import ChargedChangeFundingModalContent from "../components/ChargedChangeFundingModalContent";
import useGetClubFundings from "../services/useGetClubFundings";

const ExecutiveFundingClubFrame = () => {
  const { id: clubId } = useParams();
  const [searchText, setSearchText] = useState<string>("");
  const { data, isLoading, isError } = useGetClubFundings({
    clubId: Number(clubId),
  });

  const [selectedFundingIds, setSelectedFundingIds] = useState<number[]>([]);
  const [selectedFundingInfos, setSelectedFundingInfos] = useState<
    ChargedChangeFundingProps[]
  >([]);

  useEffect(() => {
    if (data) {
      setSelectedFundingInfos(
        data.fundings
          .filter(funding => selectedFundingIds.includes(funding.id))
          .map(funding => ({
            clubId: Number(clubId),
            clubNameKr: data.club.name,
            clubNameEn: data.club.name,
            prevExecutiveName: funding.chargedExecutive?.name ?? "",
          })),
      );
    }
  }, [data, selectedFundingIds, clubId]);

  const openChargedChangeModal = () => {
    overlay.open(({ isOpen, close }) => (
      <ChargedChangeFundingModalContent
        isOpen={isOpen}
        close={close}
        selectedFundingIds={selectedFundingIds}
        selectedFundingInfos={selectedFundingInfos}
      />
    ));
  };

  const defaultData = {
    club: {
      id: Number(clubId),
      name: "",
      nameEn: "",
      typeEnum: ClubTypeEnum.Regular,
      division: {
        id: 0,
      },
      professor: {
        id: 0,
      },
    },
    totalCount: 0,
    appliedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    committeeCount: 0,
    partialCount: 0,
    fundings: [],
    chargedExecutive: null,
  };

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FundingClubStatistic data={data ?? defaultData} />
      <FlexWrapper direction="row" gap={16}>
        <SearchInput
          searchText={searchText}
          handleChange={setSearchText}
          placeholder="검색어를 입력하세요"
        />
        <Button
          type={selectedFundingIds.length === 0 ? "disabled" : "default"}
          onClick={openChargedChangeModal}
        >
          담당자 변경
        </Button>
      </FlexWrapper>
      <ExecutiveClubFundingsTable
        fundings={data ?? defaultData}
        searchText={searchText}
        selectedFundingIds={selectedFundingIds}
        setSelectedFundingIds={setSelectedFundingIds}
      />
    </AsyncBoundary>
  );
};

export default ExecutiveFundingClubFrame;
