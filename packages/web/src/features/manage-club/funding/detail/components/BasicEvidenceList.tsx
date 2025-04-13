import React from "react";

import { IFundingResponse } from "@clubs/interface/api/funding/type/funding.type";

import ThumbnailPreviewList from "@sparcs-clubs/web/common/components/File/ThumbnailPreviewList";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import { ListItem } from "./FundingInfoList";

const BasicEvidenceList: React.FC<{ data: IFundingResponse }> = ({ data }) => (
  <FlexWrapper direction="column" gap={16}>
    <Typography
      ff="PRETENDARD"
      fw="MEDIUM"
      fs={16}
      lh={20}
      color="BLACK"
      style={{ paddingLeft: 2, paddingRight: 2 }}
    >
      필수 증빙
    </Typography>

    <ListItem>거래 사실 증빙</ListItem>
    <FlexWrapper direction="column" gap={12} style={{ paddingLeft: 24 }}>
      <ThumbnailPreviewList fileList={data.tradeEvidenceFiles} />
    </FlexWrapper>
    <ListItem>거래 세부항목 증빙</ListItem>
    <FlexWrapper direction="column" gap={12} style={{ paddingLeft: 24 }}>
      <Typography fs={14} lh={16} color="BLACK">
        {data.tradeDetailExplanation}
      </Typography>
      <ThumbnailPreviewList fileList={data.tradeDetailFiles} />
    </FlexWrapper>
  </FlexWrapper>
);

export default BasicEvidenceList;
