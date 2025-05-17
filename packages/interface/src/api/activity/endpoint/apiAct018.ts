import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";
import { zActivityDeadline } from "@clubs/domain/semester/deadline";

/**
 * @version v0.1
 * @description 활동보고서의 작성 기한을 확인합니다.
 */

const url = () => `/public/activities/deadline`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    isWritable: z.boolean(), // 현재 기간(activityDeadlineEnum)에 대해 활동보고서 작성 가능 여부
    isEditable: z.boolean(), // 현재 기간(activityDeadlineEnum)에 대해 활동보고서 수정, 삭제 가능 여부
    canApprove: z.boolean(), // 집행부원, 지도교수님이 현재 기간(activityDeadlineEnum)에 대해 활동보고서 승인 가능 여부
    targetTerm: z.object({
      id: zActivityDuration.shape.id,
      year: zActivityDuration.shape.year,
      name: zActivityDuration.shape.name,
      startTerm: zActivityDuration.shape.startTerm,
      endTerm: zActivityDuration.shape.endTerm,
    }),
    deadline: z
      .object({
        activityDeadlineEnum: zActivityDeadline.shape.deadlineEnum,
        duration: z.object({
          startTerm: zActivityDeadline.shape.startTerm,
          endTerm: zActivityDeadline.shape.endTerm,
        }),
      })
      .optional(),
  }),
};

const responseErrorMap = {};

const apiAct018 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct018RequestParam = z.infer<typeof apiAct018.requestParam>;
type ApiAct018RequestQuery = z.infer<typeof apiAct018.requestQuery>;
type ApiAct018RequestBody = z.infer<typeof apiAct018.requestBody>;
type ApiAct018ResponseOk = z.infer<(typeof apiAct018.responseBodyMap)[200]>;

export default apiAct018;

export type {
  ApiAct018RequestBody,
  ApiAct018RequestParam,
  ApiAct018RequestQuery,
  ApiAct018ResponseOk,
};
