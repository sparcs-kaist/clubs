import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@clubs/domain/club/club";

import { registry } from "@clubs/interface/open-api";

const url = (clubId: number) =>
  `/executive/clubs/club/${clubId}/registration-cancellation`;
const method = "PATCH";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});
const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({}),
};

const responseErrorMap = {};

type ApiClb017RequestParam = z.infer<typeof requestParam>;
type ApiClb017ResponseOk = z.infer<(typeof responseBodyMap)[200]>;

const apiClb017 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

export default apiClb017;
export type { ApiClb017RequestParam, ApiClb017ResponseOk };

registry.registerPath({
  tags: ["club"],
  method: "patch",
  path: "/executive/clubs/club/:clubId/registration-cancellation",
  summary: "CLB-017: 동아리 등록을 무효 처리합니다",
  description: `# CLB-017

현재 등록된 동아리를 등록취소 상태로 변경합니다.

동아리 학기 정보와 대표자·대의원 임기를 처리 시각에 종료하고,
대기 중인 대표자 변경 요청과 회원 등록 신청을 함께 정리합니다.

집행부원으로 로그인되어 있어야 합니다.
  `,
  request: {
    params: requestParam,
  },
  responses: {
    200: {
      description: "동아리 등록을 무효 처리했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
