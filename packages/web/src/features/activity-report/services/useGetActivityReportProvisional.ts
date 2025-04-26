import { useQuery } from "@tanstack/react-query";

import { ApiAct029ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct029";

import { activityReportProvisionalGet } from "@sparcs-clubs/web/features/register-club/services/_atomic/actApiList";
import {
  axiosClientWithAuth,
  // defineAxiosMock,
} from "@sparcs-clubs/web/lib/axios";

export const activityReportProvisionalDetailQueryKey = (activityId: number) => [
  activityReportProvisionalGet(activityId),
];

export const useGetActivityReportProvisional = (
  profile: string,
  activityId: number,
) =>
  useQuery<ApiAct029ResponseOk, Error>({
    queryKey: activityReportProvisionalDetailQueryKey(activityId),
    queryFn: async (): Promise<ApiAct029ResponseOk> => {
      const { data } = await axiosClientWithAuth.get(
        activityReportProvisionalGet(activityId),
        {},
      );

      // return apiAct029.responseBodyMap[200].parse(data);
      return data;
    },
  });

// defineAxiosMock(mock => {
//   mock.onGet(apiAct029.url(1)).reply(() => {
//     const dummy: z.infer<(typeof apiAct029.responseBodyMap)[200]> = {
//       activity: {
//         club: {
//           id: 1,
//           name: "ClubOld Name",
//           typeEnum: ClubTypeEnum.ClubOld,
//           division: {
//             id: 1,
//           },
//         },
//         originalName: "Original Activity Name",
//         name: "Activity Name",
//         activityTypeEnumId: 1,
//         durations: [
//           startTerm: new Date(),
//           endTerm: new Date(),
//         },
//       ],
//       location: "Activity Location",
//       purpose: "Activity Purpose",
//       detail: "Activity Detail",
//       evidence: "Activity Evidence",
//       evidenceFiles: [
//         {
//           fileId: "file-uuid",
//           name: "file-name",
//           url: "file-url",
//         },
//       ],
//       participants: [
//         {
//           studentId: 20200515,
//           studentNumber: 20200515,
//           name: "이지윤",
//         },
//         {
//           studentId: 20200513,
//           studentNumber: 20200513,
//           name: "박병찬",
//         },
//         {
//           studentId: 20230512,
//           studentNumber: 20230512,
//           name: "이도라",
//         },
//       ],
//       activityStatusEnumId: ActivityStatusEnum.Rejected,
//       comments: [
//         {
//           content: "그냥 맘에 안듬",
//           createdAt: new Date(),
//         },
//       ],
//       updatedAt: new Date(),
//       professorApprovedAt: new Date(),
//       editedAt: new Date(),
//       commentedAt: null,
//     };
//     return [200, dummy];
//   });
// });
