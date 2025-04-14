import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName } from "@clubs/interface/common/commonString";

/**
 * @version v0.1
 * @description 활동확인서 발급을 위한 동아리 활동 내역을 반환합니다.
 */

const url = () => `/student/activity-certificates/club-history`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    clubs: z.array(
      z.object({
        id: z.number().int(),
        nameKr: zClubName,
        nameEn: zClubName,
        dateRange: z.array(
          z.object({ startMonth: z.date(), endMonth: z.date().optional() }),
        ),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAcf002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAcf002RequestParam = z.infer<typeof apiAcf002.requestParam>;
type ApiAcf002RequestQuery = z.infer<typeof apiAcf002.requestQuery>;
type ApiAcf002RequestBody = z.infer<typeof apiAcf002.requestBody>;
type ApiAcf002ResponseOk = z.infer<(typeof apiAcf002.responseBodyMap)[200]>;

export default apiAcf002;

export type {
  ApiAcf002RequestBody,
  ApiAcf002RequestParam,
  ApiAcf002RequestQuery,
  ApiAcf002ResponseOk,
};
