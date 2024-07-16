import React from "react";

import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import { Status } from "@sparcs-clubs/web/common/components/ProgressCheckSection/_atomic/ProgressDot";
import ProgressStatus from "@sparcs-clubs/web/common/components/ProgressStatus";

interface FundingDetailFrameProps {
  isNow: boolean;
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const FundingDetailFrame: React.FC<FundingDetailFrameProps> = ({ isNow }) => (
  <FlexWrapper direction="column" gap={40}>
    <Card outline>
      {isNow && (
        <ProgressStatus
          labels={["신청 완료", "동아리 연합회 승인 대기"]}
          progress={[{ status: Status.Approved, date: new Date() }]}
          // TODO: 반려일 경우 optional에 RejectReasonToast 추가
        />
      )}
    </Card>
    <ButtonWrapper>
      <Button type="default">목록으로 돌아가기</Button>
      {isNow && (
        <FlexWrapper direction="row" gap={10}>
          <Button type="default">삭제</Button>
          <Button type="default">신청</Button>
        </FlexWrapper>
      )}
    </ButtonWrapper>
  </FlexWrapper>
);
export default FundingDetailFrame;
