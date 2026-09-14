import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("my.services");
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
              {t("requesterInfo")}
            </Typography>
            <ListContainer>
              <ListItem>{t("clubValue", { value: "술박스" })}</ListItem>
              <ListItem>
                {t("contactPersonValue", { value: "이지윤" })}
              </ListItem>
              <ListItem>{t("phoneValue", { value: "010-0000-0000" })}</ListItem>
            </ListContainer>
          </FlexWrapper>
          <FlexWrapper direction="row" gap={16}>
            <Typography fw="MEDIUM" fs={16} lh={20}>
              {t("rental.duration")}
            </Typography>
            <Typography fs={16} lh={20}>
              {t("rental.mockPeriod")}
            </Typography>
          </FlexWrapper>
          <FlexWrapper direction="column" gap={16}>
            <Typography fw="MEDIUM" fs={16} lh={20}>
              {t("rental.items")}
            </Typography>
            <ListContainer>
              <ListItem>{t("rental.easel", { count: 3 })}</ListItem>
              <ListItem>{t("rental.mat", { count: 3 })}</ListItem>
              <ListItem>{t("rental.screwdriver", { count: 3 })}</ListItem>
              <ListItem>{t("rental.pliers", { count: 3 })}</ListItem>
            </ListContainer>
          </FlexWrapper>
          <FlexWrapper direction="column" gap={16}>
            <Typography fw="MEDIUM" fs={16} lh={20}>
              {t("rental.purpose")}
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
        {t("backToList")}
      </Button>
    </>
  );
};
export default RentalDetailFrame;
