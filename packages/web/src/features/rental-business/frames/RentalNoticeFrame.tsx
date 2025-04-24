"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import { ApiRnt001ResponseOK } from "@clubs/interface/api/rental/endpoint/apiRnt001";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import StyledBottom from "@sparcs-clubs/web/common/components/StyledBottom";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import type { RentalInterface } from "../types/rental";

export interface RentalFrameProps {
  formCtx: ReturnType<typeof useFormContext<RentalInterface>>;
}

export interface RentalLimitProps {
  availableRentals: ApiRnt001ResponseOK;
  formCtx: ReturnType<typeof useFormContext<RentalInterface>>;
}

const RentalNoticeFrameInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const RentalNoticeFrame: React.FC<RentalFrameProps> = ({ formCtx }) => {
  // TODO: 다음 페이지 다녀오면 초기에 체크되어있는 상태로 만들기
  const [checked, setChecked] = useState(
    formCtx.getValues("info.phoneNumber") != null,
  );
  const handleNextClick = () => {
    formCtx.setValue("agreement", checked);
  };

  return (
    <RentalNoticeFrameInner>
      <Card outline gap={16}>
        <Typography fs={20} lh={24} fw="MEDIUM">
          안내사항
        </Typography>
        {/* 페이지 새로고침 or 나갔다 다시 들어오면 작성 상태 초기화 공지 필요 */}
        <Typography fs={16} lh={32} fw="REGULAR">
          모든 대여 사업은 동연 소속 동아리를 대상으로 하며, 신청은 각 동아리의
          대표자 또는 대의원만 가능합니다
          <br />
          기타 등등 안내 내용 -{">"} 이건 동연 측에서 준비해주겠죠?
        </Typography>
      </Card>
      <StyledBottom>
        <CheckboxOption
          checked={checked}
          onClick={() => setChecked(prev => !prev)}
          optionText="위 안내사항을 모두 숙지하였으며, 이에 동의합니다"
        />
        <Button
          type={checked ? "default" : "disabled"}
          onClick={handleNextClick}
        >
          다음
        </Button>
      </StyledBottom>
    </RentalNoticeFrameInner>
  );
};

export default RentalNoticeFrame;
