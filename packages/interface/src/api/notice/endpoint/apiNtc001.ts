import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zNotice } from "@clubs/domain/notice/notice";

/**
 * @version v0.1
 * @description 전체 공지사항 목록을 Pagination을 통해 가져옵니다
 */

const url = () => `/notices`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    notices: z
      .object({
        id: zNotice.shape.id,
        title: z.string().max(512),
        author: z.string().max(20),
        date: z.coerce.date(),
        link: z.string().max(200),
      })
      .array(),
    total: z.coerce.number().int().min(0),
    offset: z.coerce.number().int().min(0),
    lastUpdateTime: z.coerce.date(),
  }),
};

const responseErrorMap = {};

const apiNtc001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiNtc001RequestParam = z.infer<typeof apiNtc001.requestParam>;
type ApiNtc001RequestQuery = z.infer<typeof apiNtc001.requestQuery>;
type ApiNtc001RequestBody = z.infer<typeof apiNtc001.requestBody>;
type ApiNtc001ResponseOK = z.infer<(typeof apiNtc001.responseBodyMap)[200]>;

export default apiNtc001;

export type {
  ApiNtc001RequestParam,
  ApiNtc001RequestQuery,
  ApiNtc001RequestBody,
  ApiNtc001ResponseOK,
};
