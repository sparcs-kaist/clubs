import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 회의 내용을 수정합니다.
 */

const url = (meetingId: number, agendaId: number, contentId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/contents/content/${contentId}`;
const method = "PUT";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
  contentId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({
  content: z.coerce.string(),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiMee014 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee014RequestParam = z.infer<typeof apiMee014.requestParam>;
type ApiMee014RequestQuery = z.infer<typeof apiMee014.requestQuery>;
type ApiMee014RequestBody = z.infer<typeof apiMee014.requestBody>;
type ApiMee014ResponseOk = z.infer<(typeof apiMee014.responseBodyMap)[200]>;

export default apiMee014;

export type {
  ApiMee014RequestBody,
  ApiMee014RequestParam,
  ApiMee014RequestQuery,
  ApiMee014ResponseOk,
};
