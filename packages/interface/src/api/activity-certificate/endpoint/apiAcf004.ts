import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 신청한 활동확인서 발급 신청 정보를 가져옵니다
 */

const url = (id: number) =>
  `/student/activity-certificates/activity-certificate/${id}`;
const method = "GET";

const requestParam = z.object({
  id: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    id: z.coerce.number().int().min(1),
    clubId: z.coerce.number().int().min(1),
    studentNumber: z.coerce.number().int().min(1),
    studentPhoneNumber: zKrPhoneNumber,
    issuedNumber: z.coerce.number().int().min(1),
    statusEnum: z.nativeEnum(ActivityCertificateOrderStatusEnum),
    items: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        startMonth: z.coerce.date(),
        endMonth: z.coerce.date(),
        detail: z.coerce.string().max(100),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAcf004 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAcf004RequestParam = z.infer<typeof apiAcf004.requestParam>;
type ApiAcf004RequestQuery = z.infer<typeof apiAcf004.requestQuery>;
type ApiAcf004RequestBody = z.infer<typeof apiAcf004.requestBody>;
type ApiAcf004ResponseOk = z.infer<(typeof apiAcf004.responseBodyMap)[200]>;

export default apiAcf004;

export type {
  ApiAcf004RequestParam,
  ApiAcf004RequestQuery,
  ApiAcf004RequestBody,
  ApiAcf004ResponseOk,
};
