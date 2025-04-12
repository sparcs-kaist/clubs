import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";

/**
 * @version v0.1
 * @description 활동보고서의 활동을 수정합니다
 * 동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.
 *
 * 오늘이 활동보고서 작성기간 | 수정기간 | 예외적 작성기간 이여야 합니다.
 * 활동기간 사이의 중복을 검사하지 않습니다.
 * 활동기간이 지난 활동기간 이내여야 합니다.
 * 파일 uid의 유효성을 검사하지 않습니다.
 * 참여 학생이 지난 활동기간 동아리의 소속원이였는지 확인합니다.
 */

const url = (activityId: number) =>
  `/student/activities/activity/${activityId}`;
const method = "PUT";

const requestParam = z.object({
  activityId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  name: z.string().max(255),
  activityTypeEnumId: z.nativeEnum(ActivityTypeEnum),
  durations: z
    .array(
      z.object({
        startTerm: z.coerce.date(),
        endTerm: z.coerce.date(),
      }),
    )
    .min(1), // 최소 하나의 duration 객체가 있어야 함을 보장
  location: z.string().max(255),
  purpose: z.string(),
  detail: z.string(),
  evidence: z.string(),
  evidenceFiles: z
    .array(
      z.object({
        fileId: z.string().max(255),
      }),
    )
    .min(1), // 최소 하나의 evidenceFile 객체가 있어야 함을 보장
  participants: z
    .array(
      z.object({
        studentId: z.coerce.number().int().min(1),
      }),
    )
    .min(1), // 최소 하나의 participant 객체가 있어야 함을 보장
});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

const apiAct003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct003RequestParam = z.infer<typeof apiAct003.requestParam>;
type ApiAct003RequestQuery = z.infer<typeof apiAct003.requestQuery>;
type ApiAct003RequestBody = z.infer<typeof apiAct003.requestBody>;
type ApiAct003ResponseOk = z.infer<(typeof apiAct003.responseBodyMap)[200]>;

export default apiAct003;

export type {
  ApiAct003RequestParam,
  ApiAct003RequestQuery,
  ApiAct003RequestBody,
  ApiAct003ResponseOk,
};
