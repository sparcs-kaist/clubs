"use client";

import { overlay } from "overlay-kit";
import { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import RegistrationDeadlineFormModal from "@sparcs-clubs/web/features/executive/registration/components/RegistrationDeadlineFormModal";
import RegistrationDeadlineSectionList from "@sparcs-clubs/web/features/executive/registration/components/RegistrationDeadlineSectionList";

const ExecutiveRegistrationDeadline = () => {
  const { isLoggedIn, login, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn !== undefined || profile !== undefined) {
      setLoading(false);
    }
  }, [isLoggedIn, profile]);

  if (loading) {
    return <AsyncBoundary isLoading={loading} isError />;
  }

  if (!isLoggedIn) {
    return <LoginRequired login={login} />;
  }

  if (profile?.type !== UserTypeEnum.Executive) {
    return <NotFound />;
  }

  const openRegistrationDeadlineModal = () => {
    overlay.open(({ isOpen, close }) => (
      <RegistrationDeadlineFormModal isOpen={isOpen} onClose={close} />
    ));
  };

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: "집행부원 대시보드", path: "/executive" }]}
        title="동아리 / 회원 등록 제출 기간 관리"
        action={
          <IconButton
            type="default"
            icon="add"
            onClick={openRegistrationDeadlineModal}
          >
            제출 기간 추가
          </IconButton>
        }
        enableLast
      />
      <RegistrationDeadlineSectionList />
    </FlexWrapper>
  );
};

export default ExecutiveRegistrationDeadline;
