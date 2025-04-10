import { HttpStatusCode } from "axios";
import { z } from "zod";

import { MeetingEnum } from "@sparcs-clubs/interface/common/enum/meeting.enum";

/**
 * @version v0.1
 * @description 회의와 회의 공고를 수정합니다.
 */

const url = (announcementId: number) =>
  `/executive/meetings/announcements/announcement/${announcementId}`;
const method = "PATCH";

const requestParam = z.object({
  announcementId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  meetingEnumId: z.nativeEnum(MeetingEnum).optional(),
  announcementTitle: z.coerce.string().optional(),
  announcementContent: z.coerce.string().optional(),
  startDate: z.coerce.date().optional(),
  endTerm: z.coerce.date().optional(),
  isRegular: z.coerce.boolean().optional(),
  location: z.coerce.string().optional(),
  locationEn: z.coerce.string().optional(),
  tag: z.coerce.string().optional(),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiMee003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee003RequestParam = z.infer<typeof apiMee003.requestParam>;
type ApiMee003RequestQuery = z.infer<typeof apiMee003.requestQuery>;
type ApiMee003RequestBody = z.infer<typeof apiMee003.requestBody>;
type ApiMee003ResponseCreated = z.infer<
  (typeof apiMee003.responseBodyMap)[201]
>;

export default apiMee003;

export type {
  ApiMee003RequestParam,
  ApiMee003RequestQuery,
  ApiMee003RequestBody,
  ApiMee003ResponseCreated,
};
