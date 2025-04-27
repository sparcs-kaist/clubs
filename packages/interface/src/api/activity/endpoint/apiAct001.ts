import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";
import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

const url = () => `/student/activities/activity`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  clubId: zClub.shape.id,
  name: zActivity.shape.name,
  activityTypeEnumId: zActivity.shape.activityTypeEnum, // ActivityTypeEnum.id는 양의 정수로 가정
  duration: zActivity.shape.durations,
  location: zActivity.shape.location,
  purpose: zActivity.shape.purpose,
  detail: zActivity.shape.detail,
  evidence: zActivity.shape.evidence,
  // TODO: zActivity.shape.evidenceFiles는 id를 써서 uid랑 둘중 무엇을 이용할지 결정해야함
  evidenceFiles: z
    .array(
      z.object({
        uid: z.string().max(255),
      }),
    )
    .min(1),
  // TODO: zActivity.shape.participants는 id를 써서 studentId와 둘중 무엇을 이용할지 결정해야함
  participants: z
    .array(
      z.object({
        studentId: z.coerce.number().min(1),
      }),
    )
    .min(1),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiAct001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct001RequestParam = z.infer<typeof apiAct001.requestParam>;
type ApiAct001RequestQuery = z.infer<typeof apiAct001.requestQuery>;
type ApiAct001RequestBody = z.infer<typeof apiAct001.requestBody>;
type ApiAct001ResponseCreated = z.infer<
  (typeof apiAct001.responseBodyMap)[201]
>;

export default apiAct001;

export type {
  ApiAct001RequestParam,
  ApiAct001RequestQuery,
  ApiAct001RequestBody,
  ApiAct001ResponseCreated,
};

registry.registerPath({
  tags: ["activity"],
  method: "post",
  path: "/student/activities/activity",
  description: `
  # ACT-001

  활동보고서의 활동을 추가합니다.

  동아리 대표자로 로그인되어 있어야 합니다.

  활동 기간 사이의 중복을 검사하지 않습니다.

  파일 uid의 유효성을 검사하지 않습니다.

  참여 학생이 이번학기 동아리의 소속원이였는지 확인합니다.
  `,
  summary: "ACT-001: 동아리 대표자가 활동보고서의 활동을 추가합니다.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: requestBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "성공적으로 추가되었습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[HttpStatusCode.Created],
        },
      },
    },
  },
});
