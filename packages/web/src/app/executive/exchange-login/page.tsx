"use client";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import { withAuthorization } from "@sparcs-clubs/web/common/components/withAuthorization";
import ExchangeLoginFrame from "@sparcs-clubs/web/features/executive/frames/ExchangeLoginFrame";

const ExecutiveExchangeLogin = () => (
  <FlexWrapper direction="column" gap={32}>
    <PageHead
      items={[
        { name: "집행부원 대시보드", path: "/executive" },
        { name: "로그인 갈아끼우기", path: "/executive/exchange-login" },
      ]}
      title="로그인 갈아끼우기"
    />
    <ExchangeLoginFrame />
  </FlexWrapper>
);

export default withAuthorization(ExecutiveExchangeLogin, [
  UserTypeEnum.Executive,
]);
