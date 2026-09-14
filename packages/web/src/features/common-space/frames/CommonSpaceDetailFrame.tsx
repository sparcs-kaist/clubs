import { useTranslations } from "next-intl";
import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import {
  ListContainer,
  ListItem,
} from "@sparcs-clubs/web/common/components/ListItem";
import Typography from "@sparcs-clubs/web/common/components/Typography";

const CommonSpaceDetailFrame = () => {
  const t = useTranslations("my.services");
  return (
    <FlexWrapper direction="column" gap={20}>
      {/* TODO: 아래 정보들 백 연결하기 */}
      <FlexWrapper direction="column" gap={16}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {t("requesterInfo")}
        </Typography>
        <ListContainer>
          <ListItem>{t("clubValue", { value: "술박스" })}</ListItem>
          <ListItem>{t("contactPersonValue", { value: "이지윤" })}</ListItem>
          <ListItem>{t("phoneValue", { value: "010-0000-0000" })}</ListItem>
        </ListContainer>
      </FlexWrapper>
      <FlexWrapper direction="row" gap={16}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {t("commonSpace.reservedSpace")}
        </Typography>
        <Typography fs={16} lh={20}>
          {t("commonSpace.mockReservation")}
        </Typography>
      </FlexWrapper>
    </FlexWrapper>
  );
};
export default CommonSpaceDetailFrame;
