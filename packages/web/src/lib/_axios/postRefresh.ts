import axios from "axios";

import apiAut002, {
  ApiAut002ResponseCreated,
} from "@clubs/interface/api/auth/endpoint/apiAut002";

import { env } from "@sparcs-clubs/web/env";

const postRefresh = async (): Promise<ApiAut002ResponseCreated> => {
  const instance = axios.create({ baseURL: env.NEXT_PUBLIC_API_URL });

  const { data, status } = await instance.post(
    apiAut002.url(),
    {},
    {
      withCredentials: true,
    },
  );

  switch (status) {
    case 201:
      return apiAut002.responseBodyMap[201].parse(data);
    default:
      throw new Error("Unexpected API response");
  }
};

export default postRefresh;
