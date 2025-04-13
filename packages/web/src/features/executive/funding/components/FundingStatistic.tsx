import { ApiFnd008ResponseOk } from "@clubs/interface/api/funding/endpoint/apiFnd008";

import FundingStatisticContent from "./_atomic/FundingStatisticContent";

interface FundingStatisticProps {
  fundings: ApiFnd008ResponseOk;
}

const FundingStatistic = ({ fundings }: FundingStatisticProps) => (
  <FundingStatisticContent
    totalCount={fundings.totalCount}
    appliedCount={fundings.appliedCount}
    approvedCount={fundings.approvedCount}
    rejectedCount={fundings.rejectedCount}
    committeeCount={fundings.committeeCount}
    partialCount={fundings.partialCount}
  />
);

export default FundingStatistic;
