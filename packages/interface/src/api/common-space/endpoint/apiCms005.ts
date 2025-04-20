import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zWeekTime } from "@clubs/interface/common/type/time.type";

/**
 * @version v0.1
 * @description {spaceId} 의 공용공간의 정기 사용을 신청합니다.
 *              - 집행부원으로서 로그인되어 있어야 합니다.
 *
 *              * weekTime은 커스텀 타입으로 월요일 00시(0) 부터 일요일 24시(24*7) 까지의 시간을 가지고 있습니다
 *              * interface/common/type/time.type을 참고해 주세요
 */

const url = (spaceId: number) =>
  `/executive/common-spaces/common-space/${spaceId}/orders`;
const method = "POST";

const requestParam = z.object({
  spaceId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z
  .object({
    chargeStudentId: z.coerce.number().int().min(1),
    clubId: z.coerce.number().int().min(1),
    startTime: zWeekTime,
    endTime: zWeekTime,
  })
  .refine(data => data.startTime < data.endTime, {
    message: "startTime must be earlier than endTime",
    path: ["startTime", "endTime"],
  });

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiCms005 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiCms005RequestParam = z.infer<typeof apiCms005.requestParam>;
type ApiCms005RequestQuery = z.infer<typeof apiCms005.requestQuery>;
type ApiCms005RequestBody = z.infer<typeof apiCms005.requestBody>;
type ApiCms005ResponseCreated = z.infer<
  (typeof apiCms005.responseBodyMap)[201]
>;

export default apiCms005;

export type {
  ApiCms005RequestParam,
  ApiCms005RequestQuery,
  ApiCms005RequestBody,
  ApiCms005ResponseCreated,
};
