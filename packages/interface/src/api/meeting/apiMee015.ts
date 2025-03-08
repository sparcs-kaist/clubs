import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zId } from "@sparcs-clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 회의 내용을 삭제합니다.
 */

const url = (meetingId: number, agendaId: number, contentId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/contents/content/${contentId}`;
const method = "DELETE";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
  contentId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiMee015 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee015RequestParam = z.infer<typeof apiMee015.requestParam>;
type ApiMee015RequestQuery = z.infer<typeof apiMee015.requestQuery>;
type ApiMee015RequestBody = z.infer<typeof apiMee015.requestBody>;
type ApiMee015ResponseOk = z.infer<(typeof apiMee015.responseBodyMap)[200]>;

export default apiMee015;

export type {
  ApiMee015RequestBody,
  ApiMee015RequestParam,
  ApiMee015RequestQuery,
  ApiMee015ResponseOk,
};
