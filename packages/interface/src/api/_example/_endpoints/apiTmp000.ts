import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  createErrorResponse,
  PaginationRequest,
  PaginationResponse,
} from "@clubs/interface/common/api";
import { IApiObject } from "@clubs/interface/type";

/**
 * @version v0.1
 * @description 임시 기능의 동아리의 하위 기능의 상세정보를 가져옵니다
 */

const url = (id: string) => `/temporary/clubs/club/subfeature/${id}`;
const method = "GET";

const requestParam = z.object({
  id: z.string(),
});

const requestQuery = PaginationRequest.extend({
  additional: z.string(),
});

const requestBody = z.object({
  name: z.string().max(20),
  age: z.number().int().positive().max(20),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: PaginationResponse.extend({
    name: z.string().max(20),
    age: z.number().int().min(20).max(30),
    // 중략 ㅎㅎ
  }),
  [HttpStatusCode.Created]: PaginationResponse.extend({
    name: z.string().max(20),
    age: z.number().int().min(20).max(30),
    createdAt: z.date(),
    // 중략 ㅎㅎ
  }),
};

const responseErrorMap = {
  [HttpStatusCode.Unauthorized]: createErrorResponse(
    "Unauthorized",
    "You are not authorized to access this resource.",
  ),
  [HttpStatusCode.Forbidden]: createErrorResponse(
    "Forbidden",
    "You are not allowed to access this resource.",
  ),
};

export const apiTmp000: IApiObject<typeof url, typeof method> = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};
