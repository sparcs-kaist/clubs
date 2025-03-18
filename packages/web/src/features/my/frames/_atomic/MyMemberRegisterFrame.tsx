import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import { useGetMyMemberRegistration } from "@sparcs-clubs/web/features/clubs/services/useGetMyMemberRegistration";
import MyMemberTable from "@sparcs-clubs/web/features/my/components/MyMemberTable";

const MyMemberRegisterFrame: React.FC = () => {
  const { data, isLoading, isError } = useGetMyMemberRegistration();

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={20}>
        <MoreDetailTitle title="회원 등록" moreDetail="" moreDetailPath="" />
        {data && <MyMemberTable memberRegisterList={data} />}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default MyMemberRegisterFrame;
