import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import {
  ListContainer,
  ListItem,
} from "@sparcs-clubs/web/common/components/ListItem";
import Typography from "@sparcs-clubs/web/common/components/Typography";

const PrintingDetailFrame = () => (
  <FlexWrapper direction="column" gap={20}>
    {/* TODO: 아래 정보들 백 연결하기 */}
    <FlexWrapper direction="column" gap={16}>
      <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
        신청자 정보
      </Typography>
      <ListContainer>
        <ListItem>동아리: 술박스</ListItem>
        <ListItem>담당자: 이지윤</ListItem>
        <ListItem>연락처: 010-0000-0000</ListItem>
      </ListContainer>
    </FlexWrapper>
    <FlexWrapper direction="column" gap={16}>
      <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
        대여 물품
      </Typography>
      <ListContainer>
        <ListItem>A3용지 3매</ListItem>
        <ListItem>A4용지 3매</ListItem>
        <ListItem>색상: 컬러 / 크기: 용지에 맞춤 / 마무리 작업: 없음</ListItem>
      </ListContainer>
    </FlexWrapper>
    <FlexWrapper direction="column" gap={16}>
      <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
        인쇄 목적
      </Typography>
      <ListContainer>
        <ListItem>
          대충 어떤 목적을 적었겠죠? 이게 아주아주 길어질 수도 있으려나 일단 이
          정도의 길이는 될 수 있을 것 같아요
        </ListItem>
      </ListContainer>
    </FlexWrapper>
    <FlexWrapper direction="row" gap={16}>
      <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
        수령 일시
      </Typography>
      <Typography ff="PRETENDARD" fs={16} lh={20} color="BLACK">
        2024년 3월 11일 (월) 21:00
      </Typography>
    </FlexWrapper>
  </FlexWrapper>
);
export default PrintingDetailFrame;
