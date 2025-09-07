import React from "react";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";

import useGetExecutiveClubFunding from "../hooks/useGetExecutiveClubFunding";
import ExecutiveClubFundingsTable from "./ExecutiveClubFundingsTable";

interface ExecutivePastFundingSectionProps {
  clubId: string;
}

const ExecutivePastFundingSection: React.FC<
  ExecutivePastFundingSectionProps
> = ({ clubId }) => {
  const {
    data: dataList,
    isLoading,
    isError,
  } = useGetExecutiveClubFunding(+clubId);

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
    <FoldableSectionTitle title="과거 지원금" childrenMargin="30px">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper direction="column" gap={30}>
          {dataList.map(data => (
            <FoldableSection
              key={data.term.id}
              title={`${data.term.year}년 ${data.term.name}학기 (총 ${data.items?.fundings ? data.items.fundings.length : 0}개)`}
              childrenMargin="20px"
            >
              {data.items == null ? (
                <AsyncBoundary isLoading={false} isError />
              ) : (
                <ExecutiveClubFundingsTable
                  data={data?.items ? data.items : defaultData}
                  isPast
                />
              )}
            </FoldableSection>
          ))}
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default ExecutivePastFundingSection;
