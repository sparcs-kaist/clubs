import { HttpStatusCode } from "axios";
import { z } from "zod";

import { MeetingAgendaEntityTypeEnum } from "@sparcs-clubs/interface/common/enum/meeting.enum";
import { zId } from "@sparcs-clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 Content, Vote 모두를 열람합니다.
 */

const url = (meetingId: number, agendaId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/entities`;
const method = "GET";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        meetingAgendaEntityTypeEnum: z.nativeEnum(MeetingAgendaEntityTypeEnum),
        content: z.coerce.string().optional(),
        title: z.coerce.string().max(255).optional(),
        description: z.coerce.string().optional(),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiMee027 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee027RequestParam = z.infer<typeof apiMee027.requestParam>;
type ApiMee027RequestQuery = z.infer<typeof apiMee027.requestQuery>;
type ApiMee027RequestBody = z.infer<typeof apiMee027.requestBody>;
type ApiMee027ResponseOk = z.infer<(typeof apiMee027.responseBodyMap)[200]>;

export default apiMee027;

export type {
  ApiMee027RequestBody,
  ApiMee027RequestParam,
  ApiMee027RequestQuery,
  ApiMee027ResponseOk,
};
