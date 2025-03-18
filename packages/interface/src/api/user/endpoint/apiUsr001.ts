import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClub } from "@sparcs-clubs/interface/api/club/type/club.type";
import { zStudent } from "@sparcs-clubs/interface/api/user/type/user.type";
import { registry } from "@sparcs-clubs/interface/open-api";

extendZodWithOpenApi(z);

const url = () => `student/user/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z
    .object({
      clubs: z.array(
        z.object({
          id: zClub.shape.id,
          nameKr: zClub.shape.nameKr,
          nameEn: zClub.shape.nameEn,
        }),
      ),
      id: zStudent.shape.id,
      name: zStudent.shape.name,
      email: zStudent.shape.email,
      department: z.string().max(10), // TODO: zStudentHistory와 연결하기
      studentNumber: z.number().int().min(20000000).max(30000000), // TODO: zStudent와 연결하기. 학번 문자열로 통일 필요
      phoneNumber: zStudent.shape.phoneNumber,
    })
    .openapi("CLB-001 response"),
};

const responseErrorMap = {};

registry.registerPath({
  method: "get",
  path: url(),
  description: "학생의 마이페이지 정보를 가져옵니다",
  summary: "학생의 마이페이지 정보를 가져옵니다",
  responses: {
    200: {
      description: "성공",
      content: {
        "application/json": {
          schema: responseBodyMap[200],
        },
      },
    },
  },
});

const apiUsr001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiUsr001RequestParam = z.infer<typeof apiUsr001.requestParam>;
type ApiUsr001RequestQuery = z.infer<typeof apiUsr001.requestQuery>;
type ApiUsr001RequestBody = z.infer<typeof apiUsr001.requestBody>;
type ApiUsr001ResponseOK = z.infer<(typeof apiUsr001.responseBodyMap)[200]>;

export default apiUsr001;

export type {
  ApiUsr001RequestParam,
  ApiUsr001RequestQuery,
  ApiUsr001RequestBody,
  ApiUsr001ResponseOK,
};
