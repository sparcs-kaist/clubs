import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 투표에 대해 유저가 투표한 내역을 삭제합니다. (투표를 취소)
 */

const url = (meetingId: number, agendaId: number, voteId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/votes/vote/${voteId}/users`; // CHACHA: user 모듈이 있지는 않지만..!
const method = "DELETE";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
  voteId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiMee023 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee023RequestParam = z.infer<typeof apiMee023.requestParam>;
type ApiMee023RequestQuery = z.infer<typeof apiMee023.requestQuery>;
type ApiMee023RequestBody = z.infer<typeof apiMee023.requestBody>;
type ApiMee023ResponseOk = z.infer<(typeof apiMee023.responseBodyMap)[200]>;

export default apiMee023;

export type {
  ApiMee023RequestBody,
  ApiMee023RequestParam,
  ApiMee023RequestQuery,
  ApiMee023ResponseOk,
};
