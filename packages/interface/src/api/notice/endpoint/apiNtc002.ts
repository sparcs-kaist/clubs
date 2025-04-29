import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 공지사항의 최근 업데이트 시간을 띄웁니다.
 */

const url = () => `/notices/lastupdatetime`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    time: z.date(),
  }),
};

const responseErrorMap = {};

const apiNtc002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiNtc002RequestParam = z.infer<typeof apiNtc002.requestParam>;
type ApiNtc002RequestQuery = z.infer<typeof apiNtc002.requestQuery>;
type ApiNtc002RequestBody = z.infer<typeof apiNtc002.requestBody>;
type ApiNtc002ResponseOK = z.infer<(typeof apiNtc002.responseBodyMap)[200]>;

export default apiNtc002;

export type {
  ApiNtc002RequestParam,
  ApiNtc002RequestQuery,
  ApiNtc002RequestBody,
  ApiNtc002ResponseOK,
};
