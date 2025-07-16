import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";
import { ClubDelegateEnum } from "@clubs/domain/club/club-delegate";
import { zStudent } from "@clubs/domain/user/student";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";
import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 동아리의 대표자 및 대의원 정보를 가져옵니다
 */

const url = (clubId: number) => `/student/clubs/club/${clubId}/delegates`;
const method = "GET";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    delegates: z.array(
      z.object({
        delegateEnumId: z.nativeEnum(ClubDelegateEnum),
        studentId: zStudent.shape.id,
        studentNumber: z.coerce.number().int().min(1),
        name: zStudent.shape.name,
        phoneNumber: zKrPhoneNumber,
      }),
    ),
  }),
};

const responseErrorMap = {};

type ApiClb006RequestParam = z.infer<typeof apiClb006.requestParam>;
type ApiClb006RequestQuery = z.infer<typeof apiClb006.requestQuery>;
type ApiClb006RequestBody = z.infer<typeof apiClb006.requestBody>;
type ApiClb006ResponseOK = z.infer<(typeof apiClb006.responseBodyMap)[200]>;

const apiClb006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb006;

export type {
  ApiClb006RequestParam,
  ApiClb006RequestQuery,
  ApiClb006RequestBody,
  ApiClb006ResponseOK,
};

registry.registerPath({
  tags: ["club"],
  method: "get",
  path: "/student/clubs/club/:clubId/delegates",
  summary: "CLB-006: 동아리의 대표자 및 대의원 정보를 가져옵니다",
  description: `# CLB-006

동아리의 대표자 및 대의원 정보를 가져옵니다.

동아리 대표자로 로그인되어 있어야 합니다.

현재 동아리의 대표자와 대의원 1, 2의 정보를 조회할 수 있습니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "성공적으로 동아리 대표자 및 대의원 정보를 가져왔습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
