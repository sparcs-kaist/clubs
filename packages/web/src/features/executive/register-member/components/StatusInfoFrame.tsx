import React from "react";
import styled from "styled-components";

import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import { MemTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

type StatusInfo = {
  status: RegistrationApplicationStudentStatusEnum;
  regular: number;
  nonRegular: number;
  total: number;
};
interface StatusInfoFrameProps {
  isTotal?: boolean;
  statusInfo: StatusInfo;
}

const StatusWrapper = styled.div`
  width: 100%;
  min-width: 0;
  padding-left: 28px;
`;

const TotalCountContainer = styled.div`
  width: 120px;
  height: 24px;
  justify-content: space-between;
  align-items: center;
  display: flex;
  flex-direction: row;
`;

const TotalTitleContainer = styled.div`
  width: fit-content;
  padding: 4px 12px;
  height: 24px;
  justify-content: center;
  align-items: center;
  display: flex;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
`;

const StatusCountContainer = styled.div`
  width: max-content;
  min-width: 160px;
  gap: 16px;
  white-space: nowrap;
  height: 24px;
  justify-content: space-between;
  align-items: center;
  display: flex;
  flex-direction: row;
`;

const StatusContentsContainer = styled.div`
  width: 60px;
  height: 24px;
  justify-content: center;
  align-items: center;
  display: flex;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
`;

export const TotalContentsContainer = styled.div`
  flex: 1;
  height: 24px;
  justify-content: center;
  align-items: center;
  display: flex;
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;
`;

const StatusInfoFrame: React.FC<StatusInfoFrameProps> = ({
  statusInfo,
  isTotal = false,
}) => {
  const { color, text } = getTagDetail(statusInfo.status, MemTagList);

  return (
    <StatusWrapper>
      <FlexWrapper
        gap={40}
        direction="row"
        style={{ flexWrap: "wrap", rowGap: 12 }}
      >
        <TotalCountContainer>
          {isTotal ? (
            <TotalTitleContainer>전체</TotalTitleContainer>
          ) : (
            <Tag color={color}>{text}</Tag>
          )}
          <TotalContentsContainer>{statusInfo.total}명</TotalContentsContainer>
        </TotalCountContainer>

        <StatusCountContainer>
          <Tag color="BLUE">학부총학생회 회원 수</Tag>
          <StatusContentsContainer>
            {statusInfo.regular}명
          </StatusContentsContainer>
        </StatusCountContainer>

        <StatusCountContainer>
          <Tag color="GRAY">기타</Tag>
          <StatusContentsContainer>
            {statusInfo.nonRegular}명
          </StatusContentsContainer>
        </StatusCountContainer>
      </FlexWrapper>
    </StatusWrapper>
  );
};

export default StatusInfoFrame;
