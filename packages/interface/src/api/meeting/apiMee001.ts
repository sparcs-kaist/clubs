import { HttpStatusCode } from "axios";
import { z } from "zod";

import { MeetingEnum } from "@sparcs-clubs/interface/common/enum/meeting.enum";

/**
 * @version v0.1
 * @description 회의와 회의 공고를 생성합니다
 */

const url = () => `/executive/meetings/announcements/announcement`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  meetingEnumId: z.nativeEnum(MeetingEnum),
  announcementTitle: z.string().min(1),
  announcementContent: z.string().min(1),
  startDate: z.coerce.date(),
  endTerm: z.coerce.date().optional(),
  isRegular: z.coerce.boolean(),
  location: z.string().min(1).optional(),
  locationEn: z.string().min(1).optional(),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({
    id: z.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiMee001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee001RequestParam = z.infer<typeof apiMee001.requestParam>;
type ApiMee001RequestQuery = z.infer<typeof apiMee001.requestQuery>;
type ApiMee001RequestBody = z.infer<typeof apiMee001.requestBody>;
type ApiMee001ResponseCreated = z.infer<
  (typeof apiMee001.responseBodyMap)[201]
>;

export default apiMee001;

export type {
  ApiMee001RequestParam,
  ApiMee001RequestQuery,
  ApiMee001RequestBody,
  ApiMee001ResponseCreated,
};
