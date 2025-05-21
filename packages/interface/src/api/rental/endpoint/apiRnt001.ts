import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 대여 가능한 물품의 최대 갯수를 가져옵니다
 */

const url = () => `/rentals/objects/available`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  startDate: z.coerce.date(),
  endTerm: z.coerce.date(),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    objects: z
      .object({
        id: z.coerce.number().int().min(1),
        name: z.string().max(30),
        maximum: z.coerce.number().int().min(0),
      })
      .array(),
  }),
};

const responseErrorMap = {};

const apiRnt001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiRnt001RequestParam = z.infer<typeof apiRnt001.requestParam>;
type ApiRnt001RequestQuery = z.infer<typeof apiRnt001.requestQuery>;
type ApiRnt001RequestBody = z.infer<typeof apiRnt001.requestBody>;
type ApiRnt001ResponseOK = z.infer<(typeof apiRnt001.responseBodyMap)[200]>;

export default apiRnt001;

export type {
  ApiRnt001RequestParam,
  ApiRnt001RequestQuery,
  ApiRnt001RequestBody,
  ApiRnt001ResponseOK,
};
