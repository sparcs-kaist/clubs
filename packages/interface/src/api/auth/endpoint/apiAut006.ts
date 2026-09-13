import { HttpStatusCode } from "axios";
import { z } from "zod";

import apiAut002 from "./apiAut002";

/** 집행부의 현재 로그인을 선택한 사용자 계정으로 교체합니다. */
const apiAut006 = {
  url: () => "/executive/auth/exchange-login",
  method: "POST",
  requestParam: z.object({}),
  requestQuery: z.object({}),
  requestBody: z.object({
    userId: z
      .custom<number>(value => typeof value === "number")
      .pipe(z.coerce.number().int().positive().max(2147483647)),
  }),
  responseBodyMap: {
    [HttpStatusCode.Created]: apiAut002.responseBodyMap[201],
  },
  responseErrorMap: {},
};

export type ApiAut006RequestBody = z.infer<typeof apiAut006.requestBody>;
export type ApiAut006ResponseCreated = z.infer<
  (typeof apiAut006.responseBodyMap)[201]
>;
export default apiAut006;
