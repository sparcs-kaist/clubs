import React, { useState } from "react";
import styled from "styled-components";
import * as XLSX from "xlsx";

import apiClb010, {
  ApiClb010ResponseOk,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb010";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

import AllMemberList from "../components/AllMemberList";
import MemberSearchAndFilter from "../components/MemberSearchAndFilter";
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
  const [searchText, setSearchText] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const {
    data: semesterData,
    isLoading,
    isError,
  } = useGetClubSemesters({ clubId });

  const [selectedSemesters, setSelectedSemesters] = useState<SemesterProps[]>(
    semesterData.semesters,
  );

  const downloadExcel = async () => {
    setIsDownloading(true);
    try {
      const allData = await Promise.all(
        selectedSemesters.map(async semester => {
          const response = await axiosClientWithAuth.get(
            apiClb010.url(clubId, semester.id),
          );
          return { semester, members: response.data.members };
        }),
      );

      const wb = XLSX.utils.book_new();

      allData.forEach(({ semester, members }) => {
        const sheetData = members.map(
          (member: ApiClb010ResponseOk["members"][number]) => ({
            학번: member.studentNumber,
            신청자: member.name,
            전화번호: member.phoneNumber,
            이메일: member.email,
          }),
        );
        const sheetName = `${semester.year}-${semester.name}`;
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = "전체회원명단.xlsx";
      downloadLink.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("엑셀 다운로드 실패", error);
    }
    setIsDownloading(false);
  };

  return (
    <FoldableSectionTitle title="전체 회원 명단" childrenMargin="20px">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <AllMemberListWrapper>
          {semesterData.semesters.length > 0 && (
            <>
              <IconButtonWrapper>
                <IconButton
                  type="default"
                  icon="save_alt"
                  onClick={downloadExcel}
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
