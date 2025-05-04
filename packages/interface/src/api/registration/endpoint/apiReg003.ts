import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zClubName } from "@clubs/interface/common/commonString";
import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";

/**
 * @version v0.1
 * @description 이번학기 동아리 신규등록 신청이 가능한 동아리 id 목록을 리턴합니다.
 */

const url = () =>
  `/student/registrations/club-registrations/club-registration/qualifications/promotional`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    clubs: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        clubNameKr: zClubName,
        clubNameEn: zClubName,
        professor: z
          .object({
            name: z.string().max(255),
            email: z
              .string()
              .email()
              .refine(email => email.endsWith("@kaist.ac.kr"), {
                message: "Must be a valid KAIST email address",
              }),
            professorEnumId: z.nativeEnum(ProfessorEnum),
          })
          .optional(),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiReg003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg003RequestParam = z.infer<typeof apiReg003.requestParam>;
type ApiReg003RequestQuery = z.infer<typeof apiReg003.requestQuery>;
type ApiReg003RequestBody = z.infer<typeof apiReg003.requestBody>;
type ApiReg003ResponseOk = z.infer<(typeof apiReg003.responseBodyMap)[200]>;

export default apiReg003;

export type {
  ApiReg003RequestParam,
  ApiReg003RequestQuery,
  ApiReg003RequestBody,
  ApiReg003ResponseOk,
};
