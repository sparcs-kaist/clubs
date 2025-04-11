import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@sparcs-clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 회의 내용을 생성합니다.
 */

const url = (meetingId: number, agendaId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/contents/content`;
const method = "POST";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({
  content: z.coerce.string(),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiMee013 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee013RequestParam = z.infer<typeof apiMee013.requestParam>;
type ApiMee013RequestQuery = z.infer<typeof apiMee013.requestQuery>;
type ApiMee013RequestBody = z.infer<typeof apiMee013.requestBody>;
type ApiMee013ResponseOk = z.infer<(typeof apiMee013.responseBodyMap)[201]>;

export default apiMee013;

export type {
  ApiMee013RequestBody,
  ApiMee013RequestParam,
  ApiMee013RequestQuery,
  ApiMee013ResponseOk,
};
