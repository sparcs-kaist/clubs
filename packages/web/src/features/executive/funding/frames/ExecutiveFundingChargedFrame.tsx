import { useParams } from "next/navigation";
import React, { useMemo } from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";

import FundingChargedClubTable from "../components/FundingChargedClubTable";
import FundingChargedOtherTable from "../components/FundingChargedOtherTable";
import FundingChargedStatistic from "../components/FundingChargedStatistic";
import useGetChargedFundings from "../services/useGetChargedFundings";

const ExecutiveFundingChargedFrame: React.FC = () => {
  const { id: executiveId } = useParams();
  const { data, isLoading, isError } = useGetChargedFundings({
    executiveId: Number(executiveId),
  });

  window.history.replaceState({ isClubView: false }, "");

  const defaultData = {
    totalCount: 0,
    appliedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    committeeCount: 0,
    partialCount: 0,
    fundings: [],
    chargedExecutive: {
      id: Number(executiveId),
      name: "",
      studentNumber: "",
    },
  };

  const clubsFundings = useMemo(
    () =>
      data?.fundings.reduce(
        (acc, funding) => {
          if (!funding.club?.id || !funding.chargedExecutive?.id) {
            return acc;
          }

          const newAcc = { ...acc };
          if (funding.chargedExecutive.id === data.chargedExecutive.id) {
            const clubId = funding.club.id;
            if (!newAcc[clubId]) {
              newAcc[clubId] = [];
            }
            newAcc[clubId].push(funding);
          }
          return newAcc;
        },
        {} as Record<number, typeof data.fundings>,
      ),
    [data],
  );

  const otherFundings = useMemo(
    () =>
      data?.fundings.filter(
        funding => funding.chargedExecutive?.id !== data.chargedExecutive.id,
      ),
    [data],
  );

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={40}>
        <PageHead
          items={[
            { name: "집행부원 대시보드", path: "/executive" },
            { name: "지원금 신청 내역", path: `/executive/funding` },
          ]}
          title={`지원금 검토 내역 (${data?.chargedExecutive?.name.trim() ?? "-"})`}
          enableLast
        />
        <FundingChargedStatistic data={data ?? defaultData} />
        {clubsFundings &&
          Object.entries(clubsFundings).map(([clubId, fundings]) => (
            <FundingChargedClubTable key={clubId} data={fundings ?? []} />
          ))}
        {otherFundings && otherFundings.length > 0 && (
          <FundingChargedOtherTable data={otherFundings} />
        )}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveFundingChargedFrame;
