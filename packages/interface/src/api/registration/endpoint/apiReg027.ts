import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "@sparcs-clubs/interface/api/club/type/semester.type";

/**
 * @version v0.1
 * @description 동아리 등록 신청 기간 조회
 * PUBLIC 대상입니다.
 * 현재의 학기 정보 및 동아리 등록 기간을 조회합니다.
 * 현재가 동아리 등록 기간일 경우에는 등록 기간을 가져오고, 그렇지 않으면 deadline이 null 이 나옵니다.
 */

const url = () => `/club-registrations/deadline`;
export const ApiReg027RequestUrl = `/club-registrations/deadline`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    targetSemester: z.object({
      id: zSemester.shape.id,
      year: zSemester.shape.year,
      name: zSemester.shape.name,
      startTerm: zSemester.shape.startTerm,
      endTerm: zSemester.shape.endTerm,
    }),
    deadline: z
      .object({
        startDate: z.date(),
        endDate: z.date(),
      })
      .nullable(),
  }),
};

const responseErrorMap = {};

const apiReg027 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg027RequestParam = z.infer<typeof apiReg027.requestParam>;
type ApiReg027RequestQuery = z.infer<typeof apiReg027.requestQuery>;
type ApiReg027RequestBody = z.infer<typeof apiReg027.requestBody>;
type ApiReg027ResponseOk = z.infer<(typeof apiReg027.responseBodyMap)[200]>;

export default apiReg027;

export type {
  ApiReg027RequestParam,
  ApiReg027RequestQuery,
  ApiReg027RequestBody,
  ApiReg027ResponseOk,
};
