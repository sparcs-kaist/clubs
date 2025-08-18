import { useQuery } from "@tanstack/react-query";

import {
  apiSem005,
  ApiSem005ResponseOK,
} from "@clubs/interface/api/semester/apiSem005";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

const useGetSemesterNow = () => {
  const { data, isLoading, isError } = useQuery<ApiSem005ResponseOK, Error>({
    queryKey: ["getSemesterNow"],
    queryFn: async (): Promise<ApiSem005ResponseOK> => {
      const { data: responseData } = await axiosClientWithAuth.get(
        apiSem005.url(),
      );

      return responseData;
    },
  });

  return {
    semester: data?.semester,
    isLoading,
    isError,
  };
};

export default useGetSemesterNow;
