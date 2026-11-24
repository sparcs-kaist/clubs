import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  ClubDelegateChangeRequestStatusEnum,
  zClubDelegateChangeRequest,
} from "@clubs/domain/club/club-delegate-change-request";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";
import { registry } from "@clubs/interface/open-api";

/**
 * @version v0.1
 * @description 마이페이지에서 받은 대표자 및 대의원 변경 요청을 수락하거나 거절합니다.
 */

const url = (requestId: number) =>
  `/student/clubs/delegates/requests/request/${requestId}`;
const method = "PATCH";

const requestParam = z.object({
  requestId: zClubDelegateChangeRequest.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.discriminatedUnion(
  "clubDelegateChangeRequestStatusEnum",
  [
    z.object({
      clubDelegateChangeRequestStatusEnum: z.literal(
        ClubDelegateChangeRequestStatusEnum.Approved,
      ),
      phoneNumber: zKrPhoneNumber,
    }),
    z.object({
      clubDelegateChangeRequestStatusEnum: z.literal(
        ClubDelegateChangeRequestStatusEnum.Rejected,
      ),
    }),
  ],
);

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiClb014 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiClb014RequestParam = z.infer<typeof apiClb014.requestParam>;
type ApiClb014RequestQuery = z.infer<typeof apiClb014.requestQuery>;
type ApiClb014RequestBody = z.infer<typeof apiClb014.requestBody>;
type ApiClb014ResponseCreated = z.infer<
  (typeof apiClb014.responseBodyMap)[201]
>;

export default apiClb014;

export type {
  ApiClb014RequestParam,
  ApiClb014RequestQuery,
  ApiClb014RequestBody,
  ApiClb014ResponseCreated,
};

registry.registerPath({
  tags: ["club"],
  method: "patch",
  path: "/student/clubs/delegates/requests/request/{requestId}",
  summary:
    "CLB-014: 마이페이지에서 받은 대표자 및 대의원 변경 요청 수락 및 거절",
  description: `# CLB-014

변경 요청을 받은 학생으로 로그인되어 있어야 합니다.

변경 요청을 수락하려면 유효한 전화번호가 필요합니다.
현재 같은 동아리의 대의원이 대표자 변경 요청을 수락하면 두 사람의 기존 임기를 종료하고 직책을 맞바꿉니다.
기존 대표자는 별도 수락 없이 수락자의 이전 대의원 직책을 맡습니다.
두 사람의 임기는 같은 트랜잭션에서 변경되며, 이전 대의원 직책의 대기 중인 변경 요청은 취소됩니다.
거절하면 요청 상태만 변경됩니다.
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
      description: "변경 요청을 처리했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[201],
        },
      },
    },
  },
});
