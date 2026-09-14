"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Select from "@sparcs-clubs/web/common/components/Select";
import NoManageClubForProfessor from "@sparcs-clubs/web/common/frames/NoManageClubForProfessor";
import { useGetProfessorManageClubList } from "@sparcs-clubs/web/hooks/getManageClubList";

import ClubActivitySection from "./ClubActivitySection";
import ClubInfoSection from "./ClubInfoSection";
import { getProfessorManageClubId } from "./getProfessorManageClubId";

const ProfessorManageClubFrame: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    data: manageClubList,
    isLoading,
    isError,
  } = useGetProfessorManageClubList();

  const clubId = getProfessorManageClubId(
    manageClubList,
    searchParams.get("clubId"),
  );

  // NOTE: (@dora) 동아리에 속해 있는 교수는 항상 해당 동아리의 지도교수임
  if (manageClubList.length === 0) {
    return <NoManageClubForProfessor />;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[{ name: "대표 동아리 관리", path: "/manage-club" }]}
        title="대표 동아리 관리"
      />

      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <Select
          label="동아리"
          placeholder="동아리를 선택해주세요"
          items={manageClubList.map(club => ({
            label: club.nameKr,
            value: club.id,
            selectable: true,
          }))}
          value={clubId}
          onChange={selectedClubId => {
            if (selectedClubId === null) return;
            const params = new URLSearchParams(searchParams.toString());
            params.set("clubId", selectedClubId.toString());
            router.replace(`/manage-club?${params.toString()}`, {
              scroll: false,
            });
          }}
        />

        {clubId !== null && <ClubInfoSection clubId={clubId.toString()} />}
        {clubId !== null && <ClubActivitySection clubId={clubId} />}

        {/* TODO: (@dora) 동아리 회원 명단 추가 */}
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default ProfessorManageClubFrame;
