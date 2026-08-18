import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zDbText } from "@clubs/domain/common/string";

/**
 * @version v0.1
 * @description 집행부원으로서 동아리 등록 신청을 반려합니다.
 */

const url = (applyId: string) =>
  `/executive/registrations/club-registrations/club-registration/${applyId}/send-back`;
const method = "POST";

const requestParam = z.object({
  applyId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  comment: zDbText,
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiReg017 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiReg017RequestParam = z.infer<typeof apiReg017.requestParam>;
type ApiReg017RequestQuery = z.infer<typeof apiReg017.requestQuery>;
type ApiReg017RequestBody = z.infer<typeof apiReg017.requestBody>;
type ApiReg017ResponseCreated = z.infer<
  (typeof apiReg017.responseBodyMap)[201]
>;

export default apiReg017;

export type {
  ApiReg017RequestParam,
  ApiReg017RequestQuery,
  ApiReg017RequestBody,
  ApiReg017ResponseCreated,
};
