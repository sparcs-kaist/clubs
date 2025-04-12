import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zFileName } from "@clubs/interface/common/commonString";

/**
 * @version v0.1
 * @description 파일 업로드를 위한 url과 flieId를 받아옵니다.
 * - 로그인되어 있어야 사용 가능합니다.
 * - 제출한 metadata 개수만큼의 URL과 filedId pair를 제공합니다.
 */

const url = () => `/files/upload`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  metadata: z.array(
    z.object({
      name: zFileName,
      type: z.coerce.string().max(256),
      size: z.coerce.number().int().min(1),
    }),
  ),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({
    urls: z.array(
      z.object({
        uploadUrl: z.string(),
        fileId: z.string().max(128),
        name: zFileName,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiFil001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFil001RequestParam = z.infer<typeof apiFil001.requestParam>;
type ApiFil001RequestQuery = z.infer<typeof apiFil001.requestQuery>;
type ApiFil001RequestBody = z.infer<typeof apiFil001.requestBody>;
type ApiFil001ResponseCreated = z.infer<
  (typeof apiFil001.responseBodyMap)[201]
>;

export default apiFil001;

export type {
  ApiFil001RequestParam,
  ApiFil001RequestQuery,
  ApiFil001RequestBody,
  ApiFil001ResponseCreated,
};
