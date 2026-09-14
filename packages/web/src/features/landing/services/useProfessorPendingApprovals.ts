import { useQuery } from "@tanstack/react-query";

import apiAct019, {
  ApiAct019ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct019";
import apiClb016, {
  ApiClb016ResponseOk,
} from "@clubs/interface/api/club/endpoint/apiClb016";
import apiReg021, {
  ApiReg021ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg021";
import {
  apiSem005,
  ApiSem005ResponseOK,
} from "@clubs/interface/api/semester/apiSem005";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

import { getProfessorPendingApprovals } from "../utils/getProfessorPendingApprovals";

const useProfessorPendingApprovals = (userId: number) =>
  useQuery({
    queryKey: ["professor-pending-approvals", userId],
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async ({ signal }) => {
      const [semester, clubList, registrations] = await Promise.all([
        axiosClientWithAuth.get<ApiSem005ResponseOK>(apiSem005.url(), {
          signal,
        }),
        axiosClientWithAuth.get<ApiClb016ResponseOk>(apiClb016.url(), {
          signal,
        }),
        axiosClientWithAuth.get<ApiReg021ResponseOk>(apiReg021.url(), {
          signal,
        }),
      ]);
      const semesterId = semester.data.semester.id;
      const clubs =
        clubList.data.semesters.find(item => item.id === semesterId)?.clubs ??
        [];
      const activities = await Promise.all(
        clubs.map(async club => {
          const response = await axiosClientWithAuth.get<ApiAct019ResponseOk>(
            apiAct019.url(),
            { params: { clubId: club.id }, signal },
          );
          return { ...club, activities: response.data };
        }),
      );
      return getProfessorPendingApprovals(
        semesterId,
        activities,
        registrations.data.items,
      );
    },
  });

export default useProfessorPendingApprovals;
