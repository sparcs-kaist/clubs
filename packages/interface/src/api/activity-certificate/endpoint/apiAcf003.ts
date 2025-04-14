import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";

/**
 * @version v0.1
 * @description 해당 동아리에서 신청한 활동확인서 발급 신청 목록을 가져옵니다
 */

const url = () => `/student/activity-certificates`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: z.coerce.number().int().min(1),
  startDate: z.optional(z.coerce.date()),
  endTerm: z.optional(z.coerce.date()),
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        orderId: z.coerce.number().int().min(1),
        studentName: z.string(),
        issuedNumber: z.coerce.number().int().min(1),
        statusEnum: z.nativeEnum(ActivityCertificateOrderStatusEnum),
        createdAt: z.coerce.date(),
      }),
    ),
    total: z.coerce.number().int().min(0),
    offset: z.coerce.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiAcf003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAcf003RequestParam = z.infer<typeof apiAcf003.requestParam>;
type ApiAcf003RequestQuery = z.infer<typeof apiAcf003.requestQuery>;
type ApiAcf003RequestBody = z.infer<typeof apiAcf003.requestBody>;
type ApiAcf003ResponseOk = z.infer<(typeof apiAcf003.responseBodyMap)[200]>;

export default apiAcf003;

export type {
  ApiAcf003RequestParam,
  ApiAcf003RequestQuery,
  ApiAcf003RequestBody,
  ApiAcf003ResponseOk,
};
