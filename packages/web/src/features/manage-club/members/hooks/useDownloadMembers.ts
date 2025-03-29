import { useCallback, useState } from "react";

import apiClb010, {
  ApiClb010ResponseOk,
} from "@sparcs-clubs/interface/api/club/endpoint/apiClb010";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";
import downloadExcel from "@sparcs-clubs/web/utils/downloadExcel";

import { SemesterProps } from "../types/semesterList";

export function useDownloadMembers() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadMembers = useCallback(
    async (clubId: number, selectedSemesters: SemesterProps[]) => {
      setIsDownloading(true);
      try {
        const allData = await Promise.all(
          selectedSemesters.map(async semester => {
            const response = await axiosClientWithAuth.get<ApiClb010ResponseOk>(
              apiClb010.url(clubId, semester.id),
            );
            return { semester, members: response.data.members };
          }),
        );

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
