"use client";

import type { NextPage } from "next";
import { useRouter } from "next/navigation";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import ErrorPageTemplate from "@sparcs-clubs/web/common/frames/ErrorPageTemplate";

const NotForExecutive: NextPage = () => {
  const router = useRouter();

  const Message = (
    <ErrorMessage>
      집행부원은 해당 페이지에
      <br />
      접근할 수 없습니다
    </ErrorMessage>
  );

  const goToMain = () => {
    router.push("/");
  };

  return (
    <ErrorPageTemplate
      message={Message}
      buttons={[{ text: "메인 바로가기", onClick: goToMain }]}
    />
  );
};

export default NotForExecutive;
