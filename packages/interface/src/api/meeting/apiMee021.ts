import { HttpStatusCode } from "axios";
import { z } from "zod";

import { MeetingAgendaEntityTypeEnum } from "@clubs/interface/common/enum/meeting.enum";
import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 특정 회의에 속한 안건에 달리는 Content, Vote의 순서를 변경합니다.
 */

const url = (meetingId: number, agendaId: number) =>
  `/executive/meetings/meeting/${meetingId}/agendas/agenda/${agendaId}/entities`;
const method = "PUT";

const requestParam = z.object({
  meetingId: zId,
  agendaId: zId,
});

const requestQuery = z.object({});

const requestBody = z.object({
  entityIdList: z.array(
    z.object({
      meetingAgendaEntityType: z.nativeEnum(MeetingAgendaEntityTypeEnum),
      id: zId,
    }),
  ),
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiMee021 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee021RequestParam = z.infer<typeof apiMee021.requestParam>;
type ApiMee021RequestQuery = z.infer<typeof apiMee021.requestQuery>;
type ApiMee021RequestBody = z.infer<typeof apiMee021.requestBody>;
type ApiMee021ResponseOk = z.infer<(typeof apiMee021.responseBodyMap)[200]>;

export default apiMee021;

export type {
  ApiMee021RequestBody,
  ApiMee021RequestParam,
  ApiMee021RequestQuery,
  ApiMee021ResponseOk,
};
