"use client";

import React from "react";

import Custom404 from "@sparcs-clubs/web/app/not-found";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import DivisionInfoFrame from "@sparcs-clubs/web/features/manage-division/frames/DivisionInfoFrame";

const ManageDivision: React.FC = () => {
  const mockIsDivisionPresident = true; // TODO: divisionPresident == user

  if (!mockIsDivisionPresident) {
    return <Custom404 />; // TODO: "접근 권한이 없음" 페이지
  }

  return (
    <FlexWrapper gap={60} direction="column">
      <PageHead
        items={[{ name: "분과 관리", path: "/manage-division" }]}
        title="분과 관리"
      />
      <DivisionInfoFrame />
    </FlexWrapper>
  );
};

export default ManageDivision;
