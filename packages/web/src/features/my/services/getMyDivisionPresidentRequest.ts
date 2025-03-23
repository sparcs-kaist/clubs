// import { useQuery } from "@tanstack/react-query";

import { ChangeDivisionPresidentStatusEnum } from "@sparcs-clubs/web/constants/changeDivisionPresident";

// import {
//   axiosClientWithAuth,
//   defineAxiosMock,
// } from "@sparcs-clubs/web/lib/axios";

// TODO - Div005 & Div006 API 나오면 이 코드를 사용하도록 수정할 것
// export const useGetMyDivisionPresidentRequest = () =>
//   useQuery<ApiDiv005ResponseOk, Error>({
//     queryKey: [apiDiv005.url()],
//     queryFn: async (): Promise<ApiDiv005ResponseOk> => {
//       const { data } = await axiosClientWithAuth.get(apiDiv005.url());

//       return apiDiv005.responseBodyMap[200].parse(data);
//     },
//   });

export const useGetMyDivisionPresidentRequest = () => ({
  requests: [
    {
      id: 1,
      divisionName: {
        id: 1,
        name: "'생활체육' 분과",
      },
      prevStudent: {
        name: "박병찬",
        studentNumber: 20210227,
      },
      changeDivisionPresidentStatusEnumId:
        ChangeDivisionPresidentStatusEnum.Requested,
    },
  ],
});
