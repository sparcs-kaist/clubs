import type { ApiOpC001ResponseOK } from "@clubs/interface/api/operation-committee/apiOpC001";
import { apiOpC001 } from "@clubs/interface/api/operation-committee/apiOpC001";
import type { ApiOpC002ResponseOK } from "@clubs/interface/api/operation-committee/apiOpC002";
import { apiOpC002 } from "@clubs/interface/api/operation-committee/apiOpC002";
import type { ApiOpC003ResponseOK } from "@clubs/interface/api/operation-committee/apiOpC003";
import { apiOpC003 } from "@clubs/interface/api/operation-committee/apiOpC003";

import { axiosClientWithAuth } from "@sparcs-clubs/web/lib/axios";

export const getOperationCommitteeSecret =
  async (): Promise<ApiOpC002ResponseOK> => {
    const url = apiOpC002.url();
    console.log("🔍 GET URL:", url);
    console.log("🔍 Base URL:", axiosClientWithAuth.defaults.baseURL);

    const { data } = await axiosClientWithAuth.get(url);
    return apiOpC002.responseBodyMap[200].parse(data);
  };

export const postOperationCommitteeSecret =
  async (): Promise<ApiOpC001ResponseOK> => {
    const url = apiOpC001.url();
    console.log("🔍 POST URL:", url);

    const { data } = await axiosClientWithAuth.post(url);
    return apiOpC001.responseBodyMap[201].parse(data);
  };

export const deleteOperationCommitteeSecret =
  async (): Promise<ApiOpC003ResponseOK> => {
    const url = apiOpC003.url();
    console.log("🔍 DELETE URL:", url);

    const { data } = await axiosClientWithAuth.delete(url);
    return apiOpC003.responseBodyMap[200].parse(data);
  };
