import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";
import { zStudent } from "@clubs/domain/user/student";

import { registry } from "@clubs/interface/open-api";

const url = (activityId: number) =>
  `/student/activities/activity/${activityId}`;
const method = "PUT";

const requestParam = z.object({
  activityId: zActivity.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  name: zActivity.shape.name,
  activityTypeEnumId: zActivity.shape.activityTypeEnum, // ActivityTypeEnum.id는 양의 정수로 가정
  durations: zActivity.shape.durations,
  location: zActivity.shape.location,
  purpose: zActivity.shape.purpose,
  detail: zActivity.shape.detail,
  evidence: zActivity.shape.evidence,
  // TODO: zActivity.shape.evidenceFiles는 id를 써서 uid랑 둘중 무엇을 이용할지 결정해야함
  evidenceFiles: z
    .array(
      z.object({
        fileId: z.string().max(255),
      }),
    )
    .min(1), // 최소 하나의 evidenceFile 객체가 있어야 함을 보장
  // TODO: zActivity.shape.participants는 id를 써서 studentId와 둘중 무엇을 이용할지 결정해야함
  participants: z
    .array(
      z.object({
        studentId: zStudent.shape.id,
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

registry.registerPath({
  tags: ["activity"],
  method: "put",
  path: "/student/activities/activity/:activityId",
  description: `
  # ACT-003

  활동보고서의 활동을 수정합니다.

  동아리 대표자 또는 대의원으로 로그인되어 있어야 합니다.

  오늘이 활동보고서 작성기간 | 수정기간 | 예외적 작성기간 이여야 합니다.

  활동기간 사이의 중복을 검사하지 않습니다.

  활동기간이 지난 활동기간 이내여야 합니다.

  파일 uid의 유효성을 검사하지 않습니다.

  참여 학생이 지난 활동기간 동아리의 소속원이였는지 확인합니다.
  `,
  summary: "ACT-003: 동아리 대표자가 활동보고서의 활동을 수정합니다.",
  request: {
    params: requestParam,
    query: requestQuery,
    body: {
      content: {
        "application/json": {
          schema: requestBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: "성공적으로 수정되었습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
