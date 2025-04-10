import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@sparcs-clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 투표와 관련한 모든 정보(투표 제목, 설명, 선택지, 유저가 선택한 항목, 최종 결과)를 받아옵니다.
 */

const url = (meetingId: number, agendaId: number, voteId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/votes/vote/${voteId}`;
const method = "GET";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
  voteId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    title: z.coerce.string().max(255),
    description: z.coerce.string(),
    choices: z.array(
      z.object({
        id: zId, // CHACHA: choiceId.
        choice: z.coerce.string().max(255),
      }),
    ),
    choiceId: zId, // CHACHA: what user chose, choiceId
    results: z.array(
      z.object({
        id: zId, // CHACHA: choiceId.
        votes: z.coerce.number().int().min(0),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiMee024 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee024RequestParam = z.infer<typeof apiMee024.requestParam>;
type ApiMee024RequestQuery = z.infer<typeof apiMee024.requestQuery>;
type ApiMee024RequestBody = z.infer<typeof apiMee024.requestBody>;
type ApiMee024ResponseOk = z.infer<(typeof apiMee024.responseBodyMap)[200]>;

export default apiMee024;

export type {
  ApiMee024RequestBody,
  ApiMee024RequestParam,
  ApiMee024RequestQuery,
  ApiMee024ResponseOk,
};
