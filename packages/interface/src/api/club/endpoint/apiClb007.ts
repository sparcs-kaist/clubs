import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegate } from "@clubs/domain/club/club-delegate";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리 대표자 및 대의원 변경을 요청하거나 대의원을 해제합니다.
 */

const url = (clubId: number) =>
  `/student/clubs/club/${clubId}/delegates/delegate`;
const method = "PUT";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({
  studentId: z.coerce.number().int().min(0), // studentId로 0이 넘어오면 해당 지위를 비워둡니다.
  delegateEnumId: zClubDelegate.shape.clubDelegateEnum,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

type ApiClb007RequestParam = z.infer<typeof apiClb007.requestParam>;
type ApiClb007RequestQuery = z.infer<typeof apiClb007.requestQuery>;
type ApiClb007RequestBody = z.infer<typeof apiClb007.requestBody>;
type ApiClb007ResponseCreated = z.infer<
  (typeof apiClb007.responseBodyMap)[201]
>;

const apiClb007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb007;

export type {
  ApiClb007RequestParam,
  ApiClb007RequestQuery,
  ApiClb007RequestBody,
  ApiClb007ResponseCreated,
};

registry.registerPath({
  tags: ["club"],
  method: "put",
  path: "/student/clubs/club/:clubId/delegates/delegate",
  summary: "CLB-007: 동아리 대표자 및 대의원 변경 요청, 대의원 해제",
  description: `# CLB-007

동아리 대표자로 로그인되어 있어야 합니다.

studentId로 지정한 학생에게 대표자 또는 대의원 변경 요청을 보냅니다.
지정된 학생이 요청을 수락하면 해당 직책의 임기가 시작됩니다.

studentId가 0이면 대의원 직책을 즉시 비워둡니다.
대표자는 반드시 한 명이 있어야 하므로 대표자를 0으로 설정할 수 없습니다.
  `,
  request: {
    params: requestParam,
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
      description: "변경 요청을 생성했거나 대의원 직책을 해제했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[201],
        },
      },
    },
  },
});
