import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName } from "@clubs/interface/common/commonString";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 신청한 대여 정보를 가져옵니다
 */

const url = (rentalId: number) => `/student/rentals/rental/${rentalId}`;
const method = "GET";

const requestParam = z.object({
  rentalId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: z.coerce.number().int().min(1),
    clubId: z.coerce.number().int().min(1),
    clubNameKr: zClubName,
    clubNameEn: zClubName,
    studentName: z.string(),
    studentPhoneNumber: zKrPhoneNumber,
    objects: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        name: z.string(),
        number: z.coerce.number().int().min(1),
      }),
    ),
    purpose: z.coerce.string().max(500),
    desiredStart: z.coerce.date(),
    desiredEnd: z.coerce.date(),
    startTerm: z.coerce.date(),
    endTerm: z.coerce.date(),
  }),
};

const responseErrorMap = {};

const apiRnt004 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiRnt004RequestParam = z.infer<typeof apiRnt004.requestParam>;
type ApiRnt004RequestQuery = z.infer<typeof apiRnt004.requestQuery>;
type ApiRnt004RequestBody = z.infer<typeof apiRnt004.requestBody>;
type ApiRnt004ResponseOK = z.infer<(typeof apiRnt004.responseBodyMap)[200]>;

export default apiRnt004;

export type {
  ApiRnt004RequestParam,
  ApiRnt004RequestQuery,
  ApiRnt004RequestBody,
  ApiRnt004ResponseOK,
};
