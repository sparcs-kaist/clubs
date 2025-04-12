import { HttpStatusCode } from "axios";
import { z } from "zod";

import { getKSTDate } from "@clubs/interface/common/util";

/**
 * @version v0.1
 * @description {spaceId} 의 공용공간의 비정기 사용을 신청합니다
 *              - 동아리원으로서 로그인되어 있어야 합니다.
 */

const url = (spaceId: number) =>
  `/student/common-spaces/common-space/${spaceId}/orders/order`;
const method = "POST";

const requestParam = z.object({
  spaceId: z.coerce.number().int().min(1), // spaceId는 양의 정수여야 합니다.
});

const requestQuery = z.object({});

const requestBody = z
  .object({
    clubId: z.coerce.number().int().min(1),
    email: z.coerce.string().max(50), // email은 최대 50자의 문자열이어야 합니다.
    startTerm: z.preprocess(getKSTDate, z.date()), // startTerm은 날짜 및 시간이어야 합니다.
    endTerm: z.preprocess(getKSTDate, z.date()), // endTerm은 날짜 및 시간이어야 합니다.
  })
  .refine(data => data.startTerm < data.endTerm, {
    message: "startTerm must be earlier than endTerm",
    path: ["startTerm", "endTerm"],
  });

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {
  423: z.object({
    status: z.literal("Error"), // status는 "Error"여야 합니다.
    message: z.literal("Already used by other order."), // message는 문자열이어야 합니다.
  }),
};

const apiCms003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiCms003RequestParam = z.infer<typeof apiCms003.requestParam>;
type ApiCms003RequestQuery = z.infer<typeof apiCms003.requestQuery>;
type ApiCms003RequestBody = z.infer<typeof apiCms003.requestBody>;
type ApiCms003ResponseCreated = z.infer<
  (typeof apiCms003.responseBodyMap)[201]
>;
type ApiCms003Error423 = z.infer<(typeof apiCms003.responseErrorMap)[423]>;

export default apiCms003;

export type {
  ApiCms003RequestParam,
  ApiCms003RequestQuery,
  ApiCms003RequestBody,
  ApiCms003ResponseCreated,
  ApiCms003Error423,
};
