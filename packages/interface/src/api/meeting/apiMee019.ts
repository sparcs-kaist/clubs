import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 투표의 선택지 항목을 수정합니다.
 */

const url = (meetingId: number, agendaId: number, voteId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/votes/vote/${voteId}/choices`;
const method = "PUT";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
  voteId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({
  choices: z.array(
    z.object({
      id: zId,
      choice: z.coerce.string().max(255),
    }),
  ),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiMee019 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee019RequestParam = z.infer<typeof apiMee019.requestParam>;
type ApiMee019RequestQuery = z.infer<typeof apiMee019.requestQuery>;
type ApiMee019RequestBody = z.infer<typeof apiMee019.requestBody>;
type ApiMee019ResponseOk = z.infer<(typeof apiMee019.responseBodyMap)[200]>;

export default apiMee019;

export type {
  ApiMee019RequestBody,
  ApiMee019RequestParam,
  ApiMee019RequestQuery,
  ApiMee019ResponseOk,
};
