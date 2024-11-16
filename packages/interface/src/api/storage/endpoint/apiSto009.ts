import { HttpStatusCode } from "axios";
import { z } from "zod";

/**
 * @version v0.1
 * @description 현재 학기 출력 해당 동아리의 홍보물 신청 내역을 가져옵니다.
 */

const url = (contractId: string) =>
  `/student/storage/contracts/contract/${contractId}`;
const method = "GET";

const requestParam = z.object({
  contractId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    numberOfBoxes: z.coerce.number().int().min(0),
    numberOfNonStandardItems: z.coerce.number().int().min(0),
    charge: z.coerce.number().int().min(0),
    zone: z.coerce.string().max(255),
    studentId: z.coerce.number().int().min(1),
    executiveId: z.coerce.number().int().min(1),
    applicationId: z.coerce.number().int().min(1),
    note: z.coerce.string().max(512),
  }),
};

const responseErrorMap = {};

const apiSto009 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiSto009RequestParam = z.infer<typeof apiSto009.requestParam>;
type ApiSto009RequestQuery = z.infer<typeof apiSto009.requestQuery>;
type ApiSto009RequestBody = z.infer<typeof apiSto009.requestBody>;
type ApiSto009ResponseOk = z.infer<(typeof apiSto009.responseBodyMap)[200]>;

export default apiSto009;

export type {
  ApiSto009RequestParam,
  ApiSto009RequestQuery,
  ApiSto009RequestBody,
  ApiSto009ResponseOk,
};
