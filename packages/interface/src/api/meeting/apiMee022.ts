import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 투표를 삭제합니다.
 */

const url = (meetingId: number, agendaId: number, voteId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/votes/vote/${voteId}`;
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

const apiMee022 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee022RequestParam = z.infer<typeof apiMee022.requestParam>;
type ApiMee022RequestQuery = z.infer<typeof apiMee022.requestQuery>;
type ApiMee022RequestBody = z.infer<typeof apiMee022.requestBody>;
type ApiMee022ResponseOk = z.infer<(typeof apiMee022.responseBodyMap)[200]>;

export default apiMee022;

export type {
  ApiMee022RequestBody,
  ApiMee022RequestParam,
  ApiMee022RequestQuery,
  ApiMee022ResponseOk,
};
