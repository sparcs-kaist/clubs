import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description "자신에게 온 승인/거절을 대기중인 분과장 변경 요청을 조회합니다.

- 소속된 정동아리가 존재하는 학생만 이용 가능합니다.
- 학생은 요청을 1개만 받을 수 있습니다(requests 배열은 길이나 0이거나 1 입니다).

 */

const url = () =>
  `/student/divisions/division/presidents/president/change-requests/change-request/my`;
export const ApiDiv005RequestUrl = `/student/divisions/division/presidents/president/change-requests/change-request/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

export enum ChangeDivisionPresidentStatusEnum {
  Requested = 1,
  Canceled,
  Rejected,
  Confirmed,
  None,
}

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    requests: z
      .object({
        id: z.coerce.number().int().min(1),
        divisionName: z.object({
          id: z.coerce.number().int().min(1),
          name: z.coerce.string(),
        }),
        prevStudent: z.object({
          name: z.coerce.string(),
          studentNumber: z.coerce.number().int().min(1),
        }),
        changeDivisionPresidentStatusEnumId: z.nativeEnum(
          ChangeDivisionPresidentStatusEnum,
        ),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiDiv005 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiDiv005RequestParam = z.infer<typeof apiDiv005.requestParam>;
type ApiDiv005RequestQuery = z.infer<typeof apiDiv005.requestQuery>;
type ApiDiv005RequestBody = z.infer<typeof apiDiv005.requestBody>;
type ApiDiv005ResponseOk = z.infer<(typeof apiDiv005.responseBodyMap)[200]>;

export default apiDiv005;

export type {
  ApiDiv005RequestParam,
  ApiDiv005RequestQuery,
  ApiDiv005RequestBody,
  ApiDiv005ResponseOk,
};
