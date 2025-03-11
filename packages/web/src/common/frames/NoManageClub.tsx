"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NoManageClub: NextPage = () => {
  const router = useRouter();

  const Message = (
    <ErrorMessage>
      이번 학기에 대표자 / 대의원으로
      <br />
      관리하는 동아리가 없습니다
    </ErrorMessage>
  );

  const goToMain = () => {
    router.push("/");
  };

  const goToMyClub = () => {
    router.push("/my/clubs");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[
        { text: "메인 바로가기", onClick: goToMain },
        { text: "나의 동아리 바로가기", onClick: goToMyClub },
      ]}
    />
  );
};

export default NoManageClub;
