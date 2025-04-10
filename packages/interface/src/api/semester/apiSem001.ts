import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "./type/semester.type";

/**
 * @version v0.1
 * @description 학기 목록을 가져옵니다.
 * - 가장 최신 학기부터 순서대로 정렬되어 있습니다.
 * - 페이지네이션을 통해 적절한 구간을 선택하여 가져올 수 있습니다.
 */

const url = () => `/public/semesters`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(0),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    semesters: z.array(
      z.object({
        id: zSemester.shape.id,
        year: zSemester.shape.year,
        name: zSemester.shape.name,
        startTerm: zSemester.shape.startTerm,
        endTerm: zSemester.shape.endTerm,
      }),
    ),
    total: z.number().int().min(0),
    offset: z.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiSem001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSem001RequestParam = z.infer<typeof apiSem001.requestParam>;
type ApiSem001RequestQuery = z.infer<typeof apiSem001.requestQuery>;
type ApiSem001RequestBody = z.infer<typeof apiSem001.requestBody>;
type ApiSem001ResponseOK = z.infer<(typeof apiSem001.responseBodyMap)[200]>;

export default apiSem001;

export type {
  ApiSem001RequestParam,
  ApiSem001RequestQuery,
  ApiSem001RequestBody,
  ApiSem001ResponseOK,
};
