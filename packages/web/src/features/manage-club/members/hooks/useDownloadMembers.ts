import { useCallback, useState } from "react";

import downloadExcel from "@sparcs-clubs/web/utils/downloadExcel";

import { useGetClubMembers } from "../services/useGetClubMembers";
import { SemesterProps } from "../types/semesterList";

export function useDownloadMembers() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMembers = useCallback(
    async (clubId: number, selectedSemesters: SemesterProps[]) => {
      setIsDownloading(true);
      try {
        const allData = selectedSemesters.map(semester => {
          const response = useGetClubMembers({
            clubId,
            semesterId: semester.id,
          });
          return { semester, members: response.data.members };
        });

        const sheets = allData.map(({ semester, members }) => ({
          name: `${semester.year}-${semester.name}`,
          data: members.map(member => ({
            학번: member.studentNumber,
            신청자: member.name,
            전화번호: member.phoneNumber,
            이메일: member.email,
          })),
        }));

        downloadExcel({
          fileName: "전체회원명단.xlsx",
          sheets,
        });
      } catch (error) {
        console.error("엑셀 다운로드 실패", error);
      } finally {
        setIsDownloading(false);
      }
    },
    [],
  );

  return { isDownloading, downloadMembers };
}
