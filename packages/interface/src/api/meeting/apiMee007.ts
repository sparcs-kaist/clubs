import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zCoercedDbText } from "@clubs/domain/common/string";

/**
 * @version v0.1
 * @description 해당 meeting의 모든 meetingAgenda의 정보를 가져옵니다.
 */

const url = (meetingId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas`;
const method = "GET";

const requestParam = z.object({
  meetingId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    agendas: z
      .object({
        agendaId: z.coerce.number().int().min(1),
        agendaEnumId: z.coerce.number().int().min(1),
        title: z.coerce.string().max(255),
        description: zCoercedDbText,
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiMee007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee007RequestParam = z.infer<typeof apiMee007.requestParam>;
type ApiMee007RequestQuery = z.infer<typeof apiMee007.requestQuery>;
type ApiMee007RequestBody = z.infer<typeof apiMee007.requestBody>;
type ApiMee007ResponseCreated = z.infer<
  (typeof apiMee007.responseBodyMap)[200]
>;

export default apiMee007;

export type {
  ApiMee007RequestParam,
  ApiMee007RequestQuery,
  ApiMee007RequestBody,
  ApiMee007ResponseCreated,
};
