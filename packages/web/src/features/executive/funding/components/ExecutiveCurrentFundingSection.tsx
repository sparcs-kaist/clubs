import { overlay } from "overlay-kit";
import React, { useEffect, useState } from "react";

import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import SearchInput from "@sparcs-clubs/web/common/components/SearchInput";

import useGetExecutiveClubFundingForDuration from "../services/useGetExecutiveClubFundingForDuration";
import ChargedChangeFundingModalContent from "./ChargedChangeFundingModalContent";
import { ChargedChangeFundingProps } from "./ChargedChangeFundingModalTable";
import ExecutiveClubFundingsTable from "./ExecutiveClubFundingsTable";
import FundingClubStatistic from "./FundingClubStatistic";

interface ExecutiveCurrentFundingSectionProps {
  clubId: string;
}

const ExecutiveCurrentFundingSection: React.FC<
  ExecutiveCurrentFundingSectionProps
> = ({ clubId }) => {
  const [searchText, setSearchText] = useState<string>("");
  const [selectedFundingIds, setSelectedFundingIds] = useState<number[]>([]);
  const [selectedFundingInfos, setSelectedFundingInfos] = useState<
    ChargedChangeFundingProps[]
  >([]);

  const { data, isLoading, isError } = useGetExecutiveClubFundingForDuration(
    Number(clubId),
    {},
  );

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
    <FoldableSectionTitle childrenMargin="30px" title="신규 지원금">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper direction="column" gap={20}>
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
            data={data ?? defaultData}
            searchText={searchText}
            selectedFundingIds={selectedFundingIds}
            setSelectedFundingIds={setSelectedFundingIds}
          />
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default ExecutiveCurrentFundingSection;
