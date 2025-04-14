import { HttpStatusCode } from "axios";
import { z } from "zod";

import { MeetingEnum } from "@clubs/interface/common/enum/meeting.enum";

/**
 * @version v0.1
 * @description 새로운 MeetingAgenda를 생성하고, Mapping Table에 연결합니다.
 */

const url = (meetingId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda`;
const method = "POST";

const requestParam = z.object({
  meetingId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  meetingEnumId: z.nativeEnum(MeetingEnum),
  title: z.coerce.string().max(255),
  description: z.coerce.string(),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiMee006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee006RequestParam = z.infer<typeof apiMee006.requestParam>;
type ApiMee006RequestQuery = z.infer<typeof apiMee006.requestQuery>;
type ApiMee006RequestBody = z.infer<typeof apiMee006.requestBody>;
type ApiMee006ResponseCreated = z.infer<
  (typeof apiMee006.responseBodyMap)[201]
>;

export default apiMee006;

export type {
  ApiMee006RequestParam,
  ApiMee006RequestQuery,
  ApiMee006RequestBody,
  ApiMee006ResponseCreated,
};
