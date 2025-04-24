import { HttpStatusCode } from "axios";
import { z } from "zod";

import { MeetingEnum } from "@clubs/interface/common/enum/meeting.enum";

/**
 * @version v0.1
 * @description 회의와 회의 공고를 조회합니다.
 */

const url = (announcementId: number) =>
  `/meetings/announcements/announcement/${announcementId}`;
const method = "GET";

const requestParam = z.object({
  announcementId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    meetingEnumId: z.nativeEnum(MeetingEnum),
    announcementTitle: z.coerce.string(),
    announcementContent: z.coerce.string(),
    startDate: z.coerce.date(),
    endTerm: z.coerce.date().optional(),
    isRegular: z.coerce.boolean(),
    location: z.coerce.string(),
    locationEn: z.coerce.string(),
    tag: z.coerce.string(),
  }),
};

const responseErrorMap = {};

const apiMee002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee002RequestParam = z.infer<typeof apiMee002.requestParam>;
type ApiMee002RequestQuery = z.infer<typeof apiMee002.requestQuery>;
type ApiMee002RequestBody = z.infer<typeof apiMee002.requestBody>;
type ApiMee002ResponseOk = z.infer<(typeof apiMee002.responseBodyMap)[200]>;

export default apiMee002;

export type {
  ApiMee002RequestParam,
  ApiMee002RequestQuery,
  ApiMee002RequestBody,
  ApiMee002ResponseOk,
};
