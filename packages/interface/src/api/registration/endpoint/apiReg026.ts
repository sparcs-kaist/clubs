import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@sparcs-clubs/interface/api/club/type/club.type";
import { zSemester } from "@sparcs-clubs/interface/api/semester/type/semester.type";

/**
 * @version v0.1
 * @description 동아리의 등록 신청자의 명수를 조회합니다.
 * 동아리 목록 -> 동아리 상세 정보 조회 페이지에서 등록 신청 기간에는 "등록 신청 N명" 이 보여야 해서 그 조회를 담당합니다.
 */

const url = (clubId: string) =>
  `/clubs/club/${clubId}/member-registration-count`;
export const ApiReg026RequestUrl = `/clubs/club/:clubId/member-registration-count`;
const method = "GET";

const requestParam = z.object({
  clubId: zClub.shape.id,
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    clubId: zClub.shape.id,
    semesterId: zSemester.shape.id,
    totalMemberRegistrationCount: z.coerce.number().int().min(0), // todo: openApi 붙이기
  }),
};

const responseErrorMap = {};

const apiReg026 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg026RequestParam = z.infer<typeof apiReg026.requestParam>;
type ApiReg026RequestQuery = z.infer<typeof apiReg026.requestQuery>;
type ApiReg026RequestBody = z.infer<typeof apiReg026.requestBody>;
type ApiReg026ResponseOk = z.infer<(typeof apiReg026.responseBodyMap)[200]>;

export default apiReg026;

export type {
  ApiReg026RequestParam,
  ApiReg026RequestQuery,
  ApiReg026RequestBody,
  ApiReg026ResponseOk,
};
