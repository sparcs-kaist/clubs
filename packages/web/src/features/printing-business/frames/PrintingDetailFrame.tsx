import { useTranslations } from "next-intl";
import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import {
  ListContainer,
  ListItem,
} from "@sparcs-clubs/web/common/components/ListItem";
import Typography from "@sparcs-clubs/web/common/components/Typography";

const PrintingDetailFrame = () => {
  const t = useTranslations("my.services");
  return (
    <FlexWrapper direction="column" gap={20}>
      {/* TODO: 아래 정보들 백 연결하기 */}
      <FlexWrapper direction="column" gap={16}>
        <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
          {t("requesterInfo")}
        </Typography>
        <ListContainer>
          <ListItem>{t("clubValue", { value: "술박스" })}</ListItem>
          <ListItem>{t("contactPersonValue", { value: "이지윤" })}</ListItem>
          <ListItem>{t("phoneValue", { value: "010-0000-0000" })}</ListItem>
        </ListContainer>
      </FlexWrapper>
      <FlexWrapper direction="column" gap={16}>
        <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
          {t("rental.items")}
        </Typography>
        <ListContainer>
          <ListItem>{t("printing.paper", { size: "A3", count: 3 })}</ListItem>
          <ListItem>{t("printing.paper", { size: "A4", count: 3 })}</ListItem>
          <ListItem>{t("printing.mockOptions")}</ListItem>
        </ListContainer>
      </FlexWrapper>
      <FlexWrapper direction="column" gap={16}>
        <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
          {t("printing.purpose")}
        </Typography>
        <ListContainer>
          <ListItem>
            대충 어떤 목적을 적었겠죠? 이게 아주아주 길어질 수도 있으려나 일단
            이 정도의 길이는 될 수 있을 것 같아요
          </ListItem>
        </ListContainer>
      </FlexWrapper>
      <FlexWrapper direction="row" gap={16}>
        <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
          {t("pickupAt")}
        </Typography>
        <Typography ff="PRETENDARD" fs={16} lh={20} color="BLACK">
          {t("printing.mockPickup")}
        </Typography>
      </FlexWrapper>
    </FlexWrapper>
  );
};
export default PrintingDetailFrame;
