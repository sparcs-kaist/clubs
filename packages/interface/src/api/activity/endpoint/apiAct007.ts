import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivity } from "@clubs/domain/activity/activity";
import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

const url = () => `/student/activities/activity/provisional`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({
  clubId: zClub.shape.id,
  name: zActivity.shape.name,
  activityTypeEnumId: zActivity.shape.activityTypeEnum,
  durations: zActivity.shape.durations,
  location: zActivity.shape.location,
  purpose: zActivity.shape.purpose,
  detail: zActivity.shape.detail,
  evidence: zActivity.shape.evidence,
  // TODO: zActivity.shape.evidenceFiles는 id를 써서 uid랑 둘중 무엇을 이용할지 결정해야함
  evidenceFiles: z.array(
    z.object({
      fileId: z.coerce.string().max(255),
    }),
  ),
  // TODO: zActivity.shape.participants는 id를 써서 studentId와 둘중 무엇을 이용할지 결정해야함
  participants: z.array(
    z.object({
      studentId: z.coerce.number().int().min(1),
    }),
  ),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiAct007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct007RequestParam = z.infer<typeof apiAct007.requestParam>;
type ApiAct007RequestQuery = z.infer<typeof apiAct007.requestQuery>;
type ApiAct007RequestBody = z.infer<typeof apiAct007.requestBody>;
type ApiAct007ResponseCreated = z.infer<
  (typeof apiAct007.responseBodyMap)[201]
>;

export default apiAct007;

export type {
  ApiAct007RequestBody,
  ApiAct007RequestParam,
  ApiAct007RequestQuery,
  ApiAct007ResponseCreated,
};

registry.registerPath({
  tags: ["activity"],
  method: "post",
  path: url(),
  summary:
    "ACT-007: 가동아리 동아리 신규등록 신청을 위한 예외적 활동보고서 작성",
  description: `
  # ACT-007

  가동아리 동아리 신규등록 신청을 위한 예외적 활동보고서 작성을 위한 API입니다.

  동아리 신규등록 신청을 위한 예외적 활동보고서 작성을 위한 API입니다.
  `,
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
      description: "성공적으로 활동보고서의 활동을 추가했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[201],
        },
      },
    },
  },
});
