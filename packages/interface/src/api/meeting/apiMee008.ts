import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zCoercedDbText } from "@clubs/domain/common/string";

/**
 * @version v0.1
 * @description 단일 agenda에 대한 내용 수정을 진행합니다.
 */

const url = (meetingId: number, agendaId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}`;
const method = "PATCH";

const requestParam = z.object({
  meetingId: z.coerce.number().int().min(1),
  agendaId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  agendaEnumId: z.coerce.number().int().min(1),
  title: z.coerce.string().max(255),
  description: zCoercedDbText,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiMee008 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee008RequestParam = z.infer<typeof apiMee008.requestParam>;
type ApiMee008RequestQuery = z.infer<typeof apiMee008.requestQuery>;
type ApiMee008RequestBody = z.infer<typeof apiMee008.requestBody>;
type ApiMee008ResponseOk = z.infer<(typeof apiMee008.responseBodyMap)[201]>;

export default apiMee008;

export type {
  ApiMee008RequestParam,
  ApiMee008RequestQuery,
  ApiMee008RequestBody,
  ApiMee008ResponseOk,
};
