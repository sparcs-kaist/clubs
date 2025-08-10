import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "@clubs/domain/semester/semester";

/**
 * @version v0.1
 * @description 현재 학기를 가져옵니다.
 */

const url = () => `/public/semesters/now`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    semester: zSemester,
  }),
};

const responseErrorMap = {};

export const apiSem005 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem005RequestParam = z.infer<typeof apiSem005.requestParam>;
type ApiSem005RequestQuery = z.infer<typeof apiSem005.requestQuery>;
type ApiSem005RequestBody = z.infer<typeof apiSem005.requestBody>;
type ApiSem005ResponseOK = z.infer<(typeof apiSem005.responseBodyMap)[200]>;

export type {
  ApiSem005RequestParam,
  ApiSem005RequestQuery,
  ApiSem005RequestBody,
  ApiSem005ResponseOK,
};
