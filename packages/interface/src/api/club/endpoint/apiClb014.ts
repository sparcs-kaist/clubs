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
 * @description 마이페이지에서 나에게 신청한 대표자 변경을 승인 또는 거절합니다.
 */

const url = (requestId: number) =>
  `/student/clubs/delegates/requests/request/${requestId}`;
const method = "PATCH";

const requestParam = z.object({
  requestId: zClubDelegateChangeRequest.shape.id,
});

const requestQuery = z.object({});

const requestBody = z
  .object({
    phoneNumber: zKrPhoneNumber.optional(),
    clubDelegateChangeRequestStatusEnum:
      zClubDelegateChangeRequest.shape.clubDelegateChangeRequestStatusEnum,
  })
  .refine(
    val =>
      val.phoneNumber !== undefined ||
      val.clubDelegateChangeRequestStatusEnum ===
        ClubDelegateChangeRequestStatusEnum.Rejected,
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
    "CLB-014: 마이페이지에서 나에게 신청한 대표자 변경을 승인 또는 거절합니다",
  description: `# CLB-014

마이페이지에서 나에게 신청한 대표자 변경을 승인 또는 거절합니다.

학생으로 로그인되어 있어야 합니다.

대표자 변경 신청을 승인하려면 전화번호를 입력해야 합니다.
거절하는 경우 전화번호는 필요하지 않습니다.
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
      description: "성공적으로 대표자 변경 신청을 처리했습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[201],
        },
      },
    },
  },
});
