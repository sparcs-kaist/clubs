import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import {
  ListContainer,
  ListItem,
} from "@sparcs-clubs/web/common/components/ListItem";
import Typography from "@sparcs-clubs/web/common/components/Typography";

const ActivityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px;
`;

const ActivityCertificateDetailFrame = () => {
  const t = useTranslations("my.services");
  return (
    <FlexWrapper direction="column" gap={20}>
      {/* TODO: 아래 정보들 백 연결하기 */}
      <FlexWrapper direction="column" gap={16}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {t("requesterInfo")}
        </Typography>
        <ListContainer>
          <ListItem>{t("nameValue", { value: "이지윤" })}</ListItem>
          <ListItem>{t("departmentValue", { value: "전산학부" })}</ListItem>
          <ListItem>{t("studentIdValue", { value: "20200510" })}</ListItem>
          <ListItem>{t("phoneValue", { value: "010-0000-0000" })}</ListItem>
        </ListContainer>
      </FlexWrapper>
      <FlexWrapper direction="column" gap={16}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {t("certificate.requestInfo")}
        </Typography>
        <ListContainer>
          <ListItem>
            {t("certificate.mockClubPeriod", { club: "술박스", count: 3 })}
          </ListItem>
          <ListItem>{t("certificate.mockPeriod")}</ListItem>
          <ListItem>{t("certificate.issuedCopies", { count: 3 })}</ListItem>
          <ListItem>{t("certificate.activityHistory")}</ListItem>
          <ActivityWrapper>
            <FlexWrapper direction="row" gap={12}>
              <Typography fw="REGULAR" fs={16} lh={20}>
                {t("certificate.mockActivityPeriod")}
              </Typography>
              <Typography fw="REGULAR" fs={16} lh={20}>
                신입생 세미나 이수
              </Typography>
            </FlexWrapper>
            {/* TODO: 나중에 list로 활동 내역 추가 */}
          </ActivityWrapper>
        </ListContainer>
      </FlexWrapper>
    </FlexWrapper>
  );
};
export default ActivityCertificateDetailFrame;
