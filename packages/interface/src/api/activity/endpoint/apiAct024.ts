import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ActivityStatusEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";
import { zId } from "@sparcs-clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 집행부원을 위한 특정 동아리의 제출 과정이 진행중인 활동보고서 검토 내역을 조회합니다.
 */

const url = () => `/executive/activities/club-brief`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: zId,
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    chargedExecutive: z
      .object({
        id: zId,
        name: z.string().max(30),
      })
      .optional(),
    items: z.array(
      z.object({
        activityId: zId,
        activityStatusEnum: z.nativeEnum(ActivityStatusEnum),
        activityName: z.string().max(255),
        commentedAt: z.coerce.date().nullable(),
        editedAt: z.coerce.date().nullable(),
        commentedExecutive: z
          .object({
            id: zId,
            name: z.string().max(30),
          })
          .optional(),
        chargedExecutive: z
          .object({
            id: zId,
            name: z.string().max(30),
          })
          .optional(),
        updatedAt: z.coerce.date(),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiAct024 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct024RequestParam = z.infer<typeof apiAct024.requestParam>;
type ApiAct024RequestQuery = z.infer<typeof apiAct024.requestQuery>;
type ApiAct024RequestBody = z.infer<typeof apiAct024.requestBody>;
type ApiAct024ResponseOk = z.infer<(typeof apiAct024.responseBodyMap)[200]>;

export default apiAct024;

export type {
  ApiAct024RequestParam,
  ApiAct024RequestQuery,
  ApiAct024RequestBody,
  ApiAct024ResponseOk,
};
