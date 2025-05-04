import { useRouter } from "next/navigation";

import { RentalOrderStatusEnum } from "@clubs/interface/common/enum/rental.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import {
  ListContainer,
  ListItem,
} from "@sparcs-clubs/web/common/components/ListItem";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import RentalProgress from "../components/RentalProgress";

const RentalDetailFrame = () => {
  const router = useRouter();
  const onClick = () => {
    router.push("/my/rental-business");
  };
  return (
    //   TODO: 아래 정보들 백 연결하기
    <>
      <Card outline gap={20}>
        <RentalProgress status={RentalOrderStatusEnum.Rejected} />
        <FlexWrapper direction="column" gap={20}>
          <FlexWrapper direction="column" gap={16}>
            <Typography fw="MEDIUM" fs={16} lh={20}>
              신청자 정보
            </Typography>
            <ListContainer>
              <ListItem>동아리: 술박스</ListItem>
              <ListItem>담당자: 이지윤</ListItem>
              <ListItem>연락처: 010-0000-0000</ListItem>
            </ListContainer>
          </FlexWrapper>
          <FlexWrapper direction="row" gap={16}>
            <Typography fw="MEDIUM" fs={16} lh={20}>
              대여 기간
            </Typography>
            <Typography fs={16} lh={20}>
              2024년 3월 11일 (월) ~ 2024년 3월 18일 (월)
            </Typography>
          </FlexWrapper>
          <FlexWrapper direction="column" gap={16}>
            <Typography fw="MEDIUM" fs={16} lh={20}>
              대여 물품
            </Typography>
            <ListContainer>
              <ListItem>이젤 3개</ListItem>
              <ListItem>돗자리 3개</ListItem>
              <ListItem>공구 {">"} 드라이버 세트 3개</ListItem>
              <ListItem>공구 {">"} 롱노우즈 3개</ListItem>
            </ListContainer>
          </FlexWrapper>
          <FlexWrapper direction="column" gap={16}>
            <Typography fw="MEDIUM" fs={16} lh={20}>
              대여 목적
            </Typography>
            <ListContainer>
              <ListItem>
                대충 어떤 목적을 적었겠죠? 이게 아주아주 길어질 수도 있으려나
                일단 이 정도의 길이는 될 수 있을 것 같아요
              </ListItem>
            </ListContainer>
          </FlexWrapper>
        </FlexWrapper>
      </Card>
      <Button style={{ width: "max-content" }} onClick={onClick}>
        목록으로 돌아가기
      </Button>
    </>
  );
};
export default RentalDetailFrame;
