"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NoManageClubForProfessor: NextPage = () => {
  const router = useRouter();

  const Message = (
    <ErrorMessage>
      이번 학기에 지도교수로
      <br />
      관리하는 동아리가 없습니다
    </ErrorMessage>
  );

  const goToMain = () => {
    router.push("/");
  };

  const goToMy = () => {
    router.push("/my");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[
        { text: "메인 바로가기", onClick: goToMain },
        { text: "마이페이지 바로가기", onClick: goToMy },
      ]}
    />
  );
};

export default NoManageClubForProfessor;
