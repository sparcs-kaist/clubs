import React from "react";

import { UserTypeEnum } from "@sparcs-clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import useGetMemberRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetMemberRegistrationDeadline";

import MyMemberRegisterFrame from "./_atomic/MyMemberRegisterFrame";
import RegisterClubFrame from "./_atomic/RegisterClubFrame";
import RegisterClubProfFrame from "./_atomic/RegisterClubProfFrame";

const MyRegisterFrame: React.FC<{ profile: string }> = ({ profile }) => {
  const { data, isLoading, isError } = useGetMemberRegistrationDeadline();

  return (
    <FoldableSectionTitle title="동아리 신청 내역">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper direction="column" gap={40}>
          {/* NOTE: (@dora) 동아리 등록 신청은 동아리 등록 신청 기간에만 보이는 게 아니라, 학기 단위로 항상 보임 */}
          {/* TODO: (@dora) 동아리 등록 신청 history 볼 수 있는 화면이 필요할지도..? */}
          <FlexWrapper direction="column" gap={20}>
            <MoreDetailTitle
              title="동아리 등록"
              moreDetail=""
              moreDetailPath=""
            />
            {profile === UserTypeEnum.Professor ? (
              <RegisterClubProfFrame />
            ) : (
              <RegisterClubFrame />
            )}
          </FlexWrapper>
          {data?.deadline && profile !== UserTypeEnum.Professor && (
            <MyMemberRegisterFrame />
          )}
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default MyRegisterFrame;
