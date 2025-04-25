import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 현재 공용공간의 예약 현황을 공용공간 id를 통해 가져옵니다
 *              - 책임자의 이름은 '*'을 적절히 추가하여 익명성을 보장합니다.
 */

const url = (spaceId: number) =>
  `/common-spaces/common-space/${spaceId}/orders`;
const method = "GET";

const requestParam = z.object({
  spaceId: z.coerce.number().int().min(1), // spaceId는 양의 정수여야 합니다.
});

const requestQuery = z
  .object({
    startDate: z.coerce.date(), // startDate는 날짜여야 합니다.
    endTerm: z.coerce.date(), // endTerm는 날짜여야 합니다.
  })
  .refine(data => data.startDate <= data.endTerm, {
    message: "startDate must be same or earlier than endTerm",
    path: ["startDate", "endTerm"],
  });

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    usageOrders: z
      .object({
        orderId: z.coerce.number().int().min(1), // orderId는 정수여야 합니다.
        clubId: z.coerce.number().int().min(1), // clubId는 Club.id와 같은 정수여야 합니다.
        chargeStudentName: z.string().max(255), // chargeStudentName은 문자열로 최대 255자여야 합니다.
        startTerm: z.coerce.date(), // startTerm은 날짜 및 시간이어야 합니다.
        endTerm: z.coerce.date(), // endTerm은 날짜 및 시간이어야 합니다.
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiCms002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiCms002RequestParam = z.infer<typeof apiCms002.requestParam>;
type ApiCms002RequestQuery = z.infer<typeof apiCms002.requestQuery>;
type ApiCms002RequestBody = z.infer<typeof apiCms002.requestBody>;
type ApiCms002ResponseOK = z.infer<(typeof apiCms002.responseBodyMap)[200]>;

export default apiCms002;

export type {
  ApiCms002RequestParam,
  ApiCms002RequestQuery,
  ApiCms002RequestBody,
  ApiCms002ResponseOK,
};
