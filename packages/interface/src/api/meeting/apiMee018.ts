import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@sparcs-clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 투표의 제목과 상세 설명을 수정합니다.
 */

const url = (meetingId: number, agendaId: number, voteId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/votes/vote/${voteId}`;
const method = "PUT";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
  voteId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({
  title: z.coerce.string().max(255),
  description: z.coerce.string(),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiMee018 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee018RequestParam = z.infer<typeof apiMee018.requestParam>;
type ApiMee018RequestQuery = z.infer<typeof apiMee018.requestQuery>;
type ApiMee018RequestBody = z.infer<typeof apiMee018.requestBody>;
type ApiMee018ResponseOk = z.infer<(typeof apiMee018.responseBodyMap)[200]>;

export default apiMee018;

export type {
  ApiMee018RequestBody,
  ApiMee018RequestParam,
  ApiMee018RequestQuery,
  ApiMee018ResponseOk,
};
