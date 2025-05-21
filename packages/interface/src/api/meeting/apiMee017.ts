import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 투표에 대한 유저의 투표 결과를 생성합니다. (투표 전체 결과 아님)
 */

const url = (meetingId: number, agendaId: number, voteId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/votes/vote/${voteId}/results`;
const method = "POST";

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
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiMee017 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee017RequestParam = z.infer<typeof apiMee017.requestParam>;
type ApiMee017RequestQuery = z.infer<typeof apiMee017.requestQuery>;
type ApiMee017RequestBody = z.infer<typeof apiMee017.requestBody>;
type ApiMee017ResponseOk = z.infer<(typeof apiMee017.responseBodyMap)[201]>;

export default apiMee017;

export type {
  ApiMee017RequestBody,
  ApiMee017RequestParam,
  ApiMee017RequestQuery,
  ApiMee017ResponseOk,
};
