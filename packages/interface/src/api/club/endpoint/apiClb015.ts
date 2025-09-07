import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { zClubDelegate } from "@clubs/domain/club/club-delegate";

import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 내가 대표자 또는 대의원으로 있는 동아리의 clubId를 가져옵니다. 대표자 또는 대의원이 아닐 경우 204 No Content를 반환합니다.
 */

const url = () => `/student/clubs/delegates/delegate/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    clubId: zClub.shape.id,
    delegateEnumId: zClubDelegate.shape.clubDelegateEnum,
  }),
  [HttpStatusCode.NoContent]: z.object({}),
};

const responseErrorMap = {};

const apiClb015 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb015RequestParam = z.infer<typeof apiClb015.requestParam>;
type ApiClb015RequestQuery = z.infer<typeof apiClb015.requestQuery>;
type ApiClb015RequestBody = z.infer<typeof apiClb015.requestBody>;
type ApiClb015ResponseOk = z.infer<(typeof apiClb015.responseBodyMap)[200]>;
type ApiClb015ResponseNoContent = z.infer<
  (typeof apiClb015.responseBodyMap)[204]
>;

export default apiClb015;

export type {
  ApiClb015RequestParam,
  ApiClb015RequestQuery,
  ApiClb015RequestBody,
  ApiClb015ResponseOk,
  ApiClb015ResponseNoContent,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/delegates/delegate/my",
  summary: "CLB-015: 내가 대표자 또는 대의원으로 있는 동아리 정보를 가져옵니다",
  description: `# CLB-015

내가 대표자 또는 대의원으로 있는 동아리의 clubId를 가져옵니다.

학생으로 로그인되어 있어야 합니다.

대표자 또는 대의원이 아닐 경우 204 No Content를 반환합니다.
현재 학기에 대표자 또는 대의원으로 활동 중인 동아리 정보를 조회할 수 있습니다.
  `,
  responses: {
    200: {
      description:
        "성공적으로 내가 대표자/대의원으로 있는 동아리 정보를 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
    204: {
      description: "현재 대표자 또는 대의원으로 활동 중인 동아리가 없습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[204],
        },
      },
    },
  },
});
