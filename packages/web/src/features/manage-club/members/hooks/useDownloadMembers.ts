import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { ApiClb010ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb010";

import downloadExcel from "@sparcs-clubs/web/utils/downloadExcel";

import { getClubMembers } from "../services/useGetClubMembers";
import { SemesterProps } from "../types/semesterList";

type Member = ApiClb010ResponseOk["members"][number];

export function useDownloadMembers() {
  const [downloadParams, setDownloadParams] = useState<{
    clubId: number;
    selectedSemesters: SemesterProps[];
  } | null>(null);

  const queries = useQueries({
    queries: downloadParams
      ? downloadParams.selectedSemesters.map(semester => ({
          queryKey: ["clubMembers", downloadParams.clubId, semester.id],
          queryFn: () => getClubMembers(downloadParams.clubId, semester.id),
          enabled: !!downloadParams,
        }))
      : [],
  });

  const isDownloading = queries.some(query => query.isFetching);

  useEffect(() => {
    if (!downloadParams) return;

    if (queries.every(query => query.isSuccess)) {
      const allData = queries.map((query, index) => {
        const semester = downloadParams.selectedSemesters[index];
        return { semester, members: query.data.members };
      });

      const sheets = allData.map(({ semester, members }) => ({
        name: `${semester.year}-${semester.name}`,
        data: members.map((member: Member) => ({
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

      setDownloadParams(null);
    }
  }, [queries, downloadParams]);

  const downloadMembers = useCallback(
    (clubId: number, selectedSemesters: SemesterProps[]) => {
      setDownloadParams({ clubId, selectedSemesters });
    },
    [],
  );

  return { isDownloading, downloadMembers };
}
