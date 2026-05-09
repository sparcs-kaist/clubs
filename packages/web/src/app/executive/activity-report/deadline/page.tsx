"use client";

import { overlay } from "overlay-kit";
import { useEffect, useState } from "react";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import LoginRequired from "@sparcs-clubs/web/common/frames/LoginRequired";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ActivityDeadlineFormModal from "@sparcs-clubs/web/features/executive/components/ActivityDeadlineFormModal";
import ManageActivityDeadlineFrame from "@sparcs-clubs/web/features/executive/frames/ManageActivityDeadlineFrame";

const ExecutiveActivityDeadline = () => {
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
    return <Custom404 />;
  }

  const openActivityDeadlineModal = () => {
    overlay.open(({ isOpen, close }) => (
      <ActivityDeadlineFormModal isOpen={isOpen} onClose={close} />
    ));
  };

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "집행부원 대시보드", path: "/executive" },
          {
            name: "활동보고서 제출 기한 관리",
            path: "/executive/activity-report/deadline",
          },
        ]}
        title="활동보고서 제출 기한 관리"
        action={
          <IconButton
            type="default"
            icon="add"
            onClick={openActivityDeadlineModal}
          >
            새 기한 추가
          </IconButton>
        }
      />
      <ManageActivityDeadlineFrame />
    </FlexWrapper>
  );
};

export default ExecutiveActivityDeadline;
