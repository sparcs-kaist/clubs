import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { zExecutiveSummary } from "@clubs/interface/api/user/type/user.type";
import { zQueryArray } from "@clubs/interface/common/zodUtil";
// import { zPickElement } from "@clubs/interface/common/zodUtil";

/**
 * @version v0.1
 * @description 동아리의 활동보고서 담당 집행부원을 선택하기 위해, 현재 해당 동아리에 할당 가능한 집행부원을 모두 불러 옵니다.
                - 동아리 목록을 받아, 동아리별로 가능 집행부원 목록을 제공합니다.
                - 할당 가능한 집행부원이란, 해당 기간에 집행부원 이면서 해당 기간 해당 동아리 활동을 하지 않는 집행부원을 말합니다.
 */

const url = () => `/executive/activities/club-charge-available-executives`;
const method = "GET";
export const ApiAct027RequestUrl =
  "/executive/activities/club-charge-available-executives";

const requestParam = z.object({});

const requestQuery = z.object({
  // clubIds: zPickElement(zClub, "id").array(),
  clubIds: zQueryArray(zClub.pick({ id: true }).shape.id),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    executives: zExecutiveSummary.array(),
  }),
};

const responseErrorMap = {};

const apiAct027 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct027RequestParam = z.infer<typeof apiAct027.requestParam>;
type ApiAct027RequestQuery = z.infer<typeof apiAct027.requestQuery>;
type ApiAct027RequestBody = z.infer<typeof apiAct027.requestBody>;
type ApiAct027ResponseOk = z.infer<(typeof apiAct027.responseBodyMap)[200]>;

export default apiAct027;

export type {
  ApiAct027RequestParam,
  ApiAct027RequestQuery,
  ApiAct027RequestBody,
  ApiAct027ResponseOk,
};
