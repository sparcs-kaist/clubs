"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NoRegisterClubForProfessor: NextPage = () => {
  const router = useRouter();

  const Message = (
    <ErrorMessage>
      지도교수는 동아리를 등록할 수 없습니다.
      <br />
      동아리 등록 승인은 마이페이지에서 가능합니다.
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

export default NoRegisterClubForProfessor;
