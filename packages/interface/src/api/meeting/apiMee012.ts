import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  MeetingEnum,
  MeetingStatusEnum,
} from "@clubs/interface/common/enum/meeting.enum";

/**
 * @version v0.1
 * @description 회의목록을 조회합니다.
 */

const url = () => `/meetings/announcements`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  meetingEnumId: z
    .preprocess(
      val => z.coerce.number().int().parse(val),
      z.nativeEnum(MeetingEnum),
    )
    .optional(),
  pageOffset: z.coerce.number().min(1),
  itemCount: z.coerce.number().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        meetingEnumId: z.nativeEnum(MeetingEnum),
        meetingTitle: z.coerce.string(),
        meetingDate: z.coerce.date(),
        isRegular: z.coerce.boolean(),
        meetingStatus: z.nativeEnum(MeetingStatusEnum),
      }),
    ),
    total: z.coerce.number().int().min(0),
    offset: z.coerce.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiMee012 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiMee012RequestParam = z.infer<typeof apiMee012.requestParam>;
type ApiMee012RequestQuery = z.infer<typeof apiMee012.requestQuery>;
type ApiMee012RequestBody = z.infer<typeof apiMee012.requestBody>;
type ApiMee012ResponseOk = z.infer<(typeof apiMee012.responseBodyMap)[200]>;

export default apiMee012;

export type {
  ApiMee012RequestBody,
  ApiMee012RequestParam,
  ApiMee012RequestQuery,
  ApiMee012ResponseOk,
};
