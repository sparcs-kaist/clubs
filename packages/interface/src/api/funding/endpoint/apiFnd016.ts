import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { zExecutiveSummary } from "@clubs/interface/api/user/type/user.type";
import { zQueryArray } from "@clubs/interface/common/zodUtil";

/**
 * @version v0.1
 * @description 동아리의 활동보고서 담당 집행부원을 선택하기 위해, 현재 해당 동아리에 할당 가능한 집행부원을 모두 불러 옵니다.
 */

const url = () => `/executive/fundings/clubs/executives`;
const method = "GET";
export const ApiFnd016RequestUrl = "/executive/fundings/clubs/executives";

const requestParam = z.object({});

const requestQuery = z.object({
  clubIds: zQueryArray(zClub.pick({ id: true }).shape.id),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    executives: z.array(zExecutiveSummary),
  }),
};

const responseErrorMap = {};

const apiFnd016 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFnd016RequestParam = z.infer<typeof apiFnd016.requestParam>;
type ApiFnd016RequestQuery = z.infer<typeof apiFnd016.requestQuery>;
type ApiFnd016RequestBody = z.infer<typeof apiFnd016.requestBody>;
type ApiFnd016ResponseOk = z.infer<(typeof apiFnd016.responseBodyMap)[200]>;

export default apiFnd016;

export type {
  ApiFnd016RequestParam,
  ApiFnd016RequestQuery,
  ApiFnd016RequestBody,
  ApiFnd016ResponseOk,
};
