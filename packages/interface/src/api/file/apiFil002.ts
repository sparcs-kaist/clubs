import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zFileName } from "@clubs/interface/common/commonString";

/**
 * @version v0.1
 * @description 파일 업로드를 위한 url과 flieId를 받아옵니다.
 * - 로그인되어 있어야 사용 가능합니다.
 * - 제출한 metadata 개수만큼의 URL과 filedId pair를 제공합니다.
 */

const url = () => `/files/metadata`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  files: z.array(
    z.object({
      fileId: z.string().max(128),
    }),
  ),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    metadata: z.array(
      z.object({
        name: zFileName,
        size: z.coerce.number().int().min(1),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiFil002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFil002RequestParam = z.infer<typeof apiFil002.requestParam>;
type ApiFil002RequestQuery = z.infer<typeof apiFil002.requestQuery>;
type ApiFil002RequestBody = z.infer<typeof apiFil002.requestBody>;
type ApiFil002ResponseOk = z.infer<(typeof apiFil002.responseBodyMap)[200]>;

export default apiFil002;

export type {
  ApiFil002RequestParam,
  ApiFil002RequestQuery,
  ApiFil002RequestBody,
  ApiFil002ResponseOk,
};
