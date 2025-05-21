import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 투표를 생성합니다.
 */

const url = (meetingId: number, agendaId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/votes/vote`;
const method = "POST";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({
  title: z.coerce.string().max(255),
  description: z.coerce.string(),
  choices: z.array(
    z.object({
      id: zId,
      choice: z.coerce.string().max(255),
    }),
  ),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiMee016 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee016RequestParam = z.infer<typeof apiMee016.requestParam>;
type ApiMee016RequestQuery = z.infer<typeof apiMee016.requestQuery>;
type ApiMee016RequestBody = z.infer<typeof apiMee016.requestBody>;
type ApiMee016ResponseOk = z.infer<(typeof apiMee016.responseBodyMap)[201]>;

export default apiMee016;

export type {
  ApiMee016RequestBody,
  ApiMee016RequestParam,
  ApiMee016RequestQuery,
  ApiMee016ResponseOk,
};
