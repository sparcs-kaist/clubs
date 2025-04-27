import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 전체 agendaList에 대한 순서 변경을 진행합니다.
 */

const url = (meetingId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas`;
const method = "PATCH";

const requestParam = z.object({
  meetingId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  agendaIdList: z.coerce.number().array().min(1),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiMee009 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee009RequestParam = z.infer<typeof apiMee009.requestParam>;
type ApiMee009RequestQuery = z.infer<typeof apiMee009.requestQuery>;
type ApiMee009RequestBody = z.infer<typeof apiMee009.requestBody>;
type ApiMee009ResponseCreated = z.infer<
  (typeof apiMee009.responseBodyMap)[201]
>;

export default apiMee009;

export type {
  ApiMee009RequestParam,
  ApiMee009RequestQuery,
  ApiMee009RequestBody,
  ApiMee009ResponseCreated,
};
