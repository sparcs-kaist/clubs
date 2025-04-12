import React, { useMemo } from "react";

import { IFundingResponse } from "@clubs/interface/api/funding/type/funding.type";
import { FixtureClassEnum } from "@clubs/interface/common/enum/funding.enum";

import ThumbnailPreviewList from "@sparcs-clubs/web/common/components/File/ThumbnailPreviewList";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  classEnumMap,
  evidenceEnumMap,
} from "@sparcs-clubs/web/utils/fundingEnumMap";

import { ListItem } from "./FundingInfoList";

interface FixtureEvidenceListProps {
  isFixture?: boolean;
  data: IFundingResponse;
}

const FixtureEvidenceList: React.FC<FixtureEvidenceListProps> = ({
  isFixture = false,
  data,
}) => {
  const content = isFixture ? "비품" : "동아리 용품";

  const { purpose, fileList } = useMemo(() => {
    if (isFixture) {
      return data.fixture?.classEnum === FixtureClassEnum.Software
        ? {
            purpose: data.fixture.softwareEvidence,
            fileList: data.fixture.softwareEvidenceFiles,
          }
        : {
            purpose: data.fixture?.purpose,
            fileList: data.fixture?.imageFiles,
          };
    }

    return data.clubSupplies?.classEnum === FixtureClassEnum.Software
      ? {
          purpose: data.clubSupplies.softwareEvidence,
          fileList: data.clubSupplies.softwareEvidenceFiles,
        }
      : {
          purpose: data.clubSupplies?.purpose,
          fileList: data.clubSupplies?.imageFiles,
        };
  }, [data, isFixture]);

  return (
    <FlexWrapper direction="column" gap={16}>
      <Typography
        ff="PRETENDARD"
        fw="MEDIUM"
        fs={16}
        lh={20}
        color="BLACK"
        style={{ paddingLeft: 2, paddingRight: 2 }}
      >
        {content} 증빙
      </Typography>
      <ListItem>
        증빙 분류: {content}{" "}
        {evidenceEnumMap(
          isFixture
            ? data.fixture?.evidenceEnum
            : data.clubSupplies?.evidenceEnum,
        )}
      </ListItem>
      <ListItem>
        {content} 분류:{" "}
        {classEnumMap(
          isFixture ? data.fixture?.classEnum : data.clubSupplies?.classEnum,
        )}
      </ListItem>
      <ListItem>
        {content}명: {isFixture ? data.fixture?.name : data.clubSupplies?.name}
      </ListItem>
      <ListItem>{content} 증빙</ListItem>

      <FlexWrapper direction="column" gap={12} style={{ paddingLeft: 24 }}>
        <Typography ff="PRETENDARD" fw="REGULAR" fs={14} lh={16} color="BLACK">
          {purpose}
        </Typography>
        <ThumbnailPreviewList fileList={fileList ?? []} />
      </FlexWrapper>
    </FlexWrapper>
  );
};

export default FixtureEvidenceList;
