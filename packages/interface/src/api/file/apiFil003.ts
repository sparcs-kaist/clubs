import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zFileName } from "@clubs/interface/common/commonString";

/**
 * @version v0.1
 * @description ileId를 통해 다운로드용 링크를 얻습니다.
 * - 로그인되어 있어야 사용 가능합니다.
 * - 유효하지 않은(생성된 적이 없는) fileId인지 검사합니다.
 * - 사용자가 집행부원으로 로그인한 경우, file의 소유권을 검사하지 않습니다.
 * - 사용자가 학생으로 로그인한 경우, file을 소유한 동아리의 현재 소속원인지 검사합니다.
 */

const url = () => `/files/download-links`;
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
    files: z.array(
      z.object({
        id: z.string().max(256),
        url: z.string(),
        name: zFileName,
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiFil003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiFil003RequestParam = z.infer<typeof apiFil003.requestParam>;
type ApiFil003RequestQuery = z.infer<typeof apiFil003.requestQuery>;
type ApiFil003RequestBody = z.infer<typeof apiFil003.requestBody>;
type ApiFil003ResponseOk = z.infer<(typeof apiFil003.responseBodyMap)[200]>;

export default apiFil003;

export type {
  ApiFil003RequestParam,
  ApiFil003RequestQuery,
  ApiFil003RequestBody,
  ApiFil003ResponseOk,
};
