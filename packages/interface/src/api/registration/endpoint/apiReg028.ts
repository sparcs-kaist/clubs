import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zSemester } from "@sparcs-clubs/interface/api/club/type/semester.type";
import { registry } from "@sparcs-clubs/interface/open-api";

/**
 * @version v0.1
 * @description 회원 등록 신청 기간 조회
 * PUBLIC 대상입니다.
 * 현재의 학기 정보 및 회원 등록 기간을 조회합니다.
 * 현재가 회원 등록 기간일 경우에는 등록 기간을 가져오고, 그렇지 않으면 deadline이 null 이 나옵니다.
 */

const url = () => `/member-registrations/deadline`;
export const ApiReg028RequestUrl = `/member-registrations/deadline`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    semester: z.object({
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

const apiReg028 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg028RequestParam = z.infer<typeof apiReg028.requestParam>;
type ApiReg028RequestQuery = z.infer<typeof apiReg028.requestQuery>;
type ApiReg028RequestBody = z.infer<typeof apiReg028.requestBody>;
type ApiReg028ResponseOk = z.infer<(typeof apiReg028.responseBodyMap)[200]>;

export default apiReg028;

export type {
  ApiReg028RequestBody,
  ApiReg028RequestParam,
  ApiReg028RequestQuery,
  ApiReg028ResponseOk,
};

registry.registerPath({
  tags: ["member-registration"],
  method: "get",
  path: url(),
  description: `
  # REG-028

  회원 등록 신청 기간 조회

  PUBLIC 대상입니다.

  현재의 학기 정보 및 회원 등록 기간을 조회합니다.

  현재가 회원 등록 기간일 경우에는 등록 기간을 가져오고, 그렇지 않으면 deadline이 null 이 나옵니다.
  `,
  summary: "REG-028: 회원 등록 신청 기간 조회",
  responses: {
    200: {
      description: "성공적으로 조회되었습니다.",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});
