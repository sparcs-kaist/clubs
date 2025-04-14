import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 대여를 신청합니다
 */

const url = () => `/student/rentals/rental`;
const method = "POST";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: z.coerce.number().int().min(1),
});

const requestBody = z.object({
  studentPhoneNumber: zKrPhoneNumber,
  objects: z
    .object({
      id: z.coerce.number().int().min(1),
      number: z.coerce.number().int().min(0),
    })
    .array(),
  purpose: z.coerce.string().max(512),
  desiredStart: z.coerce.date(),
  desiredEnd: z.coerce.date(),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {
  423: z.object({
    status: z.literal("Error"),
    message: z.literal("Already used by other order."),
  }),
};

const apiRnt002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiRnt002RequestParam = z.infer<typeof apiRnt002.requestParam>;
type ApiRnt002RequestQuery = z.infer<typeof apiRnt002.requestQuery>;
type ApiRnt002RequestBody = z.infer<typeof apiRnt002.requestBody>;
type ApiRnt002ResponseOK = z.infer<(typeof apiRnt002.responseBodyMap)[201]>;
type ApiRnt002Error423 = z.infer<(typeof apiRnt002.responseErrorMap)[423]>;

export default apiRnt002;

export type {
  ApiRnt002RequestParam,
  ApiRnt002RequestQuery,
  ApiRnt002RequestBody,
  ApiRnt002ResponseOK,
  ApiRnt002Error423,
};
