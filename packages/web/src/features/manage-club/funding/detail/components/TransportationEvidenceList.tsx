import React from "react";

import { IFundingResponse } from "@clubs/interface/api/funding/type/funding.type";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { transportationEnumMap } from "@sparcs-clubs/web/utils/fundingEnumMap";

import { ListItem } from "./FundingInfoList";

const TransportationEvidenceList: React.FC<{ data: IFundingResponse }> = ({
  data,
}) => (
  <FlexWrapper direction="column" gap={16}>
    <Typography
      ff="PRETENDARD"
      fw="MEDIUM"
      fs={16}
      lh={20}
      color="BLACK"
      style={{ paddingLeft: 2, paddingRight: 2 }}
    >
      교통비
    </Typography>
    <ListItem>
      교통수단: {transportationEnumMap(data.transportation?.enum)}
    </ListItem>
    <ListItem>출발지: {data.transportation?.origin}</ListItem>
    <ListItem>도착지: {data.transportation?.destination}</ListItem>
    {data.transportation?.passengers &&
      data.transportation?.passengers.length > 0 && (
        <>
          <ListItem>
            탑승자 명단 ({data.transportation?.passengers.length}명)
          </ListItem>
          <FlexWrapper direction="column" gap={12} style={{ paddingLeft: 24 }}>
            {data.transportation?.passengers.map(passenger => (
              <Typography
                key={passenger.name}
                ff="PRETENDARD"
                fw="REGULAR"
                fs={14}
                lh={16}
                color="BLACK"
              >
                {passenger.studentNumber} {passenger.name}
              </Typography>
            ))}
          </FlexWrapper>
        </>
      )}

    <ListItem>이용 목적: {data.transportation?.purpose}</ListItem>
  </FlexWrapper>
);

export default TransportationEvidenceList;
