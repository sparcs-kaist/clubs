import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ActivityCertificateOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/activityCertificate.enum";

/**
 * @version v0.1
 * @description 자신이 신청한 활동확인서 발급 신청 목록을 가져옵니다
 */

const url = () => `/student/activity-certificates/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  startDate: z.coerce.date().optional(),
  endTerm: z.coerce.date().optional(),
  pageOffset: z.coerce.number().min(1),
  itemCount: z.coerce.number().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        orderId: z.coerce.number().int().min(1),
        studentName: z.coerce.string(),
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

const apiAcf007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAcf007RequestParam = z.infer<typeof apiAcf007.requestParam>;
type ApiAcf007RequestQuery = z.infer<typeof apiAcf007.requestQuery>;
type ApiAcf007RequestBody = z.infer<typeof apiAcf007.requestBody>;
type ApiAcf007ResponseOk = z.infer<(typeof apiAcf007.responseBodyMap)[200]>;

export default apiAcf007;

export type {
  ApiAcf007RequestParam,
  ApiAcf007RequestQuery,
  ApiAcf007RequestBody,
  ApiAcf007ResponseOk,
};
