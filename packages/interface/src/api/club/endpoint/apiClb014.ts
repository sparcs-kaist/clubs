import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 마이페이지에서 나에게 신청한 대표자 변경을 승인 또는 거절합니다.
 */

const url = (requestId: number) =>
  `/student/clubs/delegates/requests/request/${requestId}`;
const method = "PATCH";

const requestParam = z.object({
  requestId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z
  .object({
    phoneNumber: zKrPhoneNumber.optional(),
    clubDelegateChangeRequestStatusEnum: z.nativeEnum(
      ClubDelegateChangeRequestStatusEnum,
    ),
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
