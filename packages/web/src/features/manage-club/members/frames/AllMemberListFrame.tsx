import React from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useQueryState from "@sparcs-clubs/web/common/hooks/useQueryState";

import AllMemberList from "../components/AllMemberList";
import MemberSearchAndFilter from "../components/MemberSearchAndFilter";
import { useDownloadMembers } from "../hooks/useDownloadMembers";
import { useGetClubSemesters } from "../services/useGetClubSemesters";
import { SemesterProps } from "../types/semesterList";

interface AllMemberListFrameProps {
  clubId: number;
}

const AllMemberListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

const IconButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-end;
`;

const AllMemberListFrame: React.FC<AllMemberListFrameProps> = ({ clubId }) => {
  const [searchText, setSearchText] = useQueryState<string>("memberQuery", "");
  const {
    data: semesterData,
    isLoading,
    isError,
  } = useGetClubSemesters({ clubId });

  const semesters = semesterData?.semesters ?? [];
  const [semesterIds, setSemesterIds] = useQueryState<string[]>(
    "memberSemesters",
    semesters.map(semester => String(semester.id)),
  );
  const selectedSemesters = semesters.filter(semester =>
    semesterIds.includes(String(semester.id)),
  );
  const setSelectedSemesters: React.Dispatch<
    React.SetStateAction<SemesterProps[]>
  > = next => {
    const updated = typeof next === "function" ? next(selectedSemesters) : next;
    setSemesterIds(updated.map(semester => String(semester.id)));
  };
  const { isDownloading, downloadMembers } = useDownloadMembers();

  const handleDownload = () => {
    downloadMembers(clubId, selectedSemesters);
  };

  return (
    <FoldableSectionTitle title="전체 회원 명단" childrenMargin="20px">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <AllMemberListWrapper>
          {semesterData?.semesters?.length > 0 && (
            <>
              <IconButtonWrapper>
                <IconButton
                  type="default"
                  icon="save_alt"
                  onClick={handleDownload}
                >
                  {isDownloading ? "다운로드 중..." : "엑셀로 다운로드"}
                </IconButton>
              </IconButtonWrapper>
              <MemberSearchAndFilter
                semesters={semesterData.semesters}
                selectedSemesters={selectedSemesters}
                setSelectedSemesters={setSelectedSemesters}
                searchText={searchText}
                handleChange={setSearchText}
              />
            </>
          )}
          {selectedSemesters.length === 0 ? (
            <Typography
              fs={16}
              lh={24}
              color="GRAY.300"
              style={{ textAlign: "center" }}
            >
              표시할 명단이 없습니다.
            </Typography>
          ) : (
            selectedSemesters
              .sort((a, b) => b.id - a.id)
              .map(semester => (
                <AllMemberList
                  key={semester.id}
                  semester={semester}
                  clubId={clubId}
                  searchText={searchText}
                />
              ))
          )}
        </AllMemberListWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default AllMemberListFrame;
