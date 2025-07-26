import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { ActivityStatusEnum } from "@clubs/domain/activity/activity";

import apiAct002, {
  ApiAct002ResponseOk,
} from "@clubs/interface/api/activity/endpoint/apiAct002";

import { activityDetailGet } from "@sparcs-clubs/web/features/register-club/services/_atomic/actApiList";
import {
  axiosClientWithAuth,
  defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const activityReportDetailQueryKey = (
  profile: string,
  activityId: number,
) => [activityDetailGet(profile, activityId)];

export const useGetActivityReport = (
  profile: string,
  activityId: number,
  operatingCommitteeSecret: string | undefined,
) =>
  useQuery<ApiAct002ResponseOk, Error>({
    queryKey: [
      operatingCommitteeSecret,
      ...activityReportDetailQueryKey(profile, activityId),
    ],
    queryFn: async (): Promise<ApiAct002ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        activityDetailGet(profile, activityId),
        { params: { operatingCommitteeSecret } },
      );

      // return apiAct002.responseBodyMap[200].parse(data);
      return data;
    },
  });

defineAxiosMock(mock => {
  mock.onGet(apiAct002.url(1)).reply(() => {
    const dummy: z.infer<(typeof apiAct002.responseBodyMap)[200]> = {
      clubId: 1,
      name: "Activity Name",
      activityTypeEnumId: 1,
      durations: [
        {
          startTerm: new Date(),
          endTerm: new Date(),
        },
      ],
      location: "Activity Location",
      purpose: "Activity Purpose",
      detail: "Activity Detail",
      evidence: "Activity Evidence",
      evidenceFiles: [
        {
          fileId: "file-uuid",
          name: "file-name",
          url: "file-url",
        },
      ],
      participants: [
        {
          studentId: 20200515,
          studentNumber: 20200515,
          name: "이지윤",
        },
        {
          studentId: 20200513,
          studentNumber: 20200513,
          name: "박병찬",
        },
        {
          studentId: 20230512,
          studentNumber: 20230512,
          name: "이도라",
        },
      ],
      activityStatusEnumId: ActivityStatusEnum.Rejected,
      comments: [
        {
          content: "그냥 맘에 안듬",
          createdAt: new Date(),
        },
      ],
      updatedAt: new Date(),
      professorApprovedAt: new Date(),
      editedAt: new Date(),
      commentedAt: null,
    };
    return [200, dummy];
  });
});
