import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ActivityDeadlineEnum } from "@clubs/interface/common/enum/activity.enum";

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
    isWritable: z.boolean().optional(), // 현재 기간(activityDeadlineEnum)에 대해 활동보고서 작성 가능 여부
    isEditable: z.boolean().optional(), // 현재 기간(activityDeadlineEnum)에 대해 활동보고서 수정, 삭제 가능 여부
    canApprove: z.boolean().optional(), // 집행부원, 지도교수님이 현재 기간(activityDeadlineEnum)에 대해 활동보고서 승인 가능 여부
    targetTerm: z.object({
      id: z.coerce.number().int().min(1),
      year: z.coerce.number().int().min(1900),
      name: z.string().max(255),
      startTerm: z.coerce.date(),
      endTerm: z.coerce.date(),
    }),
    deadline: z.object({
      activityDeadlineEnum: z.nativeEnum(ActivityDeadlineEnum),
      duration: z
        .object({
          startTerm: z.coerce.date(),
          endTerm: z.coerce.date(),
        })
        .refine(data => data.startTerm <= data.endTerm, {
          message: "종료일은 시작일보다 이후여야 합니다",
          path: ["endTerm"],
        }),
    }),
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
