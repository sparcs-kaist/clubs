import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import apiAct011, {
  ApiAct011RequestQuery,
} from "@clubs/interface/api/activity/endpoint/apiAct011";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

type ISuccessResponseType = z.infer<(typeof apiAct011.responseBodyMap)[200]>;
export const useGetActivityReportsForPromotional = (
  query: ApiAct011RequestQuery,
) =>
  useQuery<ISuccessResponseType, Error>({
    queryKey: [apiAct011.url(), query.clubId],
    queryFn: async (): Promise<ISuccessResponseType> => {
      const { data } = await axiosClientWithAuth.get(apiAct011.url(), {
        params: query,
      });

      return apiAct011.responseBodyMap[200].parse(data);
    },
  });
