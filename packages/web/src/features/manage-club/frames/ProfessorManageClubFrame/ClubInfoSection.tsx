import React from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import {
  getTagColorFromClubType,
  getTagColorFromDivision,
  getTagContentFromClubType,
} from "@sparcs-clubs/web/types/clubdetail.types";

interface ClubInfoSectionProps {
  clubId: string;
}

const ClubInfoRow = styled(FlexWrapper).attrs({
  direction: "row",
  gap: 16,
})``;

const ClubInfoItem: React.FC<{ title: string; content: React.ReactNode }> = ({
  title,
  content,
}) => (
  <FlexWrapper direction="row" gap={40} style={{ flex: 1 }}>
    <Typography
      fs={16}
      lh={24}
      fw="MEDIUM"
      style={{ width: "120px", textAlign: "center" }}
    >
      {title}
    </Typography>
    <Typography fs={16} lh={24} style={{ flex: 1 }}>
      {content}
    </Typography>
  </FlexWrapper>
);

const ClubInfoSection: React.FC<ClubInfoSectionProps> = ({ clubId }) => {
  const { data, isLoading, isError } = useGetClubDetail(clubId);

  if (!data) return null;

  return (
    <FoldableSectionTitle title="동아리 정보">
      <FlexWrapper direction="column" gap={40}>
        <AsyncBoundary isLoading={isLoading} isError={isError}>
          <Card outline gap={32}>
            <ClubInfoRow>
              {/* TODO: (@dora) 대표자 전화번호도 함께 보여주기 */}
              <ClubInfoItem title="대표자" content={data.representative} />
              <ClubInfoItem title="총원" content={`${data.totalMemberCnt}명`} />
            </ClubInfoRow>
            <ClubInfoRow>
              <ClubInfoItem
                title="동아리 지위"
                content={
                  <Tag
                    color={getTagColorFromClubType(data.type, data.isPermanent)}
                  >
                    {getTagContentFromClubType(data.type, data.isPermanent)}
                  </Tag>
                }
              />
              <ClubInfoItem
                title="소속 분과"
                content={
                  <Tag color={getTagColorFromDivision(data.division.name)}>
                    {data.division.name}
                  </Tag>
                }
              />
            </ClubInfoRow>
            <ClubInfoRow>
              <ClubInfoItem title="성격" content={data.characteristic ?? "-"} />
              <ClubInfoItem
                title="설립연도"
                content={`${data.foundingYear}년`}
              />
            </ClubInfoRow>
            {/* TODO: (@dora) 동아리방 데이터 추가되면 추가 */}
            {/* <ClubInfoRow>
              <ClubInfoItem title="동아리방" content={data.room ?? "-"} />
            </ClubInfoRow> */}
            <ClubInfoRow>
              <ClubInfoItem
                title="동아리 설명"
                content={
                  <Typography fs={16} lh={24}>
                    {data.description}
                  </Typography>
                }
              />
            </ClubInfoRow>
          </Card>
        </AsyncBoundary>
      </FlexWrapper>
    </FoldableSectionTitle>
  );
};

export default ClubInfoSection;
