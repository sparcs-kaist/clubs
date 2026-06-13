import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 분과의 이름과 분과장 학생 id 목록을 가져옵니다.
 * - public한 API입니다.
 * - 분과 관리 페이지에 접근 권한이 있는지 클라이언트에서 편리하게 관리하기 위한 조회입니다.
 */

const url = () => `/divisions/presidents`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    divisions: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        name: z.string(),
        presidentStudentId: z.coerce.number().int().min(1),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiDiv001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiDiv001RequestParam = z.infer<typeof apiDiv001.requestParam>;
type ApiDiv001RequestQuery = z.infer<typeof apiDiv001.requestQuery>;
type ApiDiv001RequestBody = z.infer<typeof apiDiv001.requestBody>;
type ApiDiv001ResponseOk = z.infer<(typeof apiDiv001.responseBodyMap)[200]>;

export default apiDiv001;

export type {
  ApiDiv001RequestParam,
  ApiDiv001RequestQuery,
  ApiDiv001RequestBody,
  ApiDiv001ResponseOk,
};
