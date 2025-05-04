import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 투표에 대한 유저의 선택지를 변경합니다.
 */

const url = (meetingId: number, agendaId: number, voteId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/votes/vote/${voteId}/choice`;
const method = "PUT";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
  voteId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({
  choiceId: zId,
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiMee020 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee020RequestParam = z.infer<typeof apiMee020.requestParam>;
type ApiMee020RequestQuery = z.infer<typeof apiMee020.requestQuery>;
type ApiMee020RequestBody = z.infer<typeof apiMee020.requestBody>;
type ApiMee020ResponseOk = z.infer<(typeof apiMee020.responseBodyMap)[200]>;

export default apiMee020;

export type {
  ApiMee020RequestBody,
  ApiMee020RequestParam,
  ApiMee020RequestQuery,
  ApiMee020ResponseOk,
};
