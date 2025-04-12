import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";

import { zActivitySummary } from "../type/activity.type";

/**
 * @version v0.1
 * @description 현재 학기 활동보고서 중 지원금 지출 목적으로 쓸 수 있는 항목들을 불러옵니다.
 * 구체적으로는, 해당 학기의 승인 or 운위 의 활보를 불러옵니다.
 * 오늘이 지원금 작성 or 수정 기간이어야 합니다.
 */

const url = () => "/student/activities/available";
const method = "GET";
export const ApiAct021RequestUrl = "/student/activities/available";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: zClub.pick({ id: true }).shape.id, // TODO: clubId: zPickElement(zClub, "id"),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    activities: z.array(zActivitySummary),
  }),
};

const responseErrorMap = {};

const apiAct021 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct021RequestParam = z.infer<typeof apiAct021.requestParam>;
type ApiAct021RequestQuery = z.infer<typeof apiAct021.requestQuery>;
type ApiAct021RequestBody = z.infer<typeof apiAct021.requestBody>;
type ApiAct021ResponseOk = z.infer<(typeof apiAct021.responseBodyMap)[200]>;

export default apiAct021;

export type {
  ApiAct021RequestBody,
  ApiAct021RequestParam,
  ApiAct021RequestQuery,
  ApiAct021ResponseOk,
};
