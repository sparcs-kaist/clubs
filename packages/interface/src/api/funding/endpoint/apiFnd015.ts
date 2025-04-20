import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/interface/api/club/type/club.type";
import { zExecutive } from "@clubs/interface/api/user/type/user.type";

/**
 * @version v0.1
 * @description 동아리의 지원금 서류에 대한 담당 집행부원을 변경합니다.
 */

const url = () => `/executive/fundings/clubs/executives/charged-executive`;
const method = "PATCH";
export const ApiFnd015RequestUrl =
  "/executive/fundings/clubs/executives/charged-executive";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  clubIds: z.array(zClub.pick({ id: true }).shape.id),
  executiveId: zExecutive.pick({ id: true }).shape.id,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiFnd015 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFnd015RequestParam = z.infer<typeof apiFnd015.requestParam>;
type ApiFnd015RequestQuery = z.infer<typeof apiFnd015.requestQuery>;
type ApiFnd015RequestBody = z.infer<typeof apiFnd015.requestBody>;
type ApiFnd015ResponseOk = z.infer<(typeof apiFnd015.responseBodyMap)[200]>;

export default apiFnd015;

export type {
  ApiFnd015RequestBody,
  ApiFnd015RequestParam,
  ApiFnd015RequestQuery,
  ApiFnd015ResponseOk,
};
