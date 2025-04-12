import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zExecutive } from "@clubs/interface/api/user/type/user.type";

import { zFunding } from "../type/funding.type";

/**
 * @version v0.1
 * @description 개별 지원금 신청에 대한 담당 집행부원을 변경합니다.
 */

const url = () => `/executive/fundings/executives/charged-executive`;
const method = "PATCH";
export const ApiFnd014RequestUrl =
  "/executive/fundings/executives/charged-executive";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  fundingIds: z.array(zFunding.pick({ id: true }).shape.id),
  executiveId: zExecutive.pick({ id: true }).shape.id,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiFnd014 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFnd014RequestParam = z.infer<typeof apiFnd014.requestParam>;
type ApiFnd014RequestQuery = z.infer<typeof apiFnd014.requestQuery>;
type ApiFnd014RequestBody = z.infer<typeof apiFnd014.requestBody>;
type ApiFnd014ResponseOk = z.infer<(typeof apiFnd014.responseBodyMap)[200]>;

export default apiFnd014;

export type {
  ApiFnd014RequestParam,
  ApiFnd014RequestQuery,
  ApiFnd014RequestBody,
  ApiFnd014ResponseOk,
};
