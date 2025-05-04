import { HttpStatusCode } from "axios";
import { z } from "zod";

import { CommonSpaceEnum } from "@clubs/interface/common/enum/commonSpace.enum";

/**
 * @version v0.1
 * @description 현재 동아리연합회에서 제공하는 공용공간의 목록을 가져옵니다
 */

const url = () => `/common-spaces`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    commonSpaces: z.array(
      z.object({
        id: z.coerce.number().int(),
        commonSpaceEnum: z.nativeEnum(CommonSpaceEnum),
        name: z.string().max(30),
        availableHoursPerWeek: z.coerce.number().int().min(0).max(24),
        availableHoursPerDay: z.coerce.number().int().min(0).max(24),
      }),
    ),
  }),
};

const responseErrorMap = {};

const apiCms001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiCms001RequestParam = z.infer<typeof apiCms001.requestParam>;
type ApiCms001RequestQuery = z.infer<typeof apiCms001.requestQuery>;
type ApiCms001RequestBody = z.infer<typeof apiCms001.requestBody>;
type ApiCms001ResponseOK = z.infer<(typeof apiCms001.responseBodyMap)[200]>;

export default apiCms001;

export type {
  ApiCms001RequestParam,
  ApiCms001RequestQuery,
  ApiCms001RequestBody,
  ApiCms001ResponseOK,
};
