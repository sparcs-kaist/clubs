import { HttpStatusCode } from "axios";
import { z } from "zod";

import { RentalOrderStatusEnum } from "@clubs/interface/common/enum/rental.enum";

/**
 * @version v0.1
 * @description 동아리원들이 신청한 대여 목록을 가져옵니다
 */

const url = () => `/stduent/rentals`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: z.coerce.number().int().min(0),
  startDate: z.coerce.date().optional(),
  endTerm: z.coerce.date().optional(),
  pageOffset: z.coerce.number().min(1),
  itemCount: z.coerce.number().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        id: z.number().int().min(0),
        studentName: z.string(),
        objects: z.array(
          z.object({
            id: z.number().int().min(0),
            name: z.string(),
            number: z.number().int().min(1),
          }),
        ),
        statusEnum: z.nativeEnum(RentalOrderStatusEnum),
        desiredStart: z.date(),
        desiredEnd: z.date(),
        startDate: z.date().optional(),
        endTerm: z.date().optional(),
        createdAt: z.date(),
      }),
    ),
    total: z.number().int().min(0),
    offset: z.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiRnt003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiRnt003RequestParam = z.infer<typeof apiRnt003.requestParam>;
type ApiRnt003RequestQuery = z.infer<typeof apiRnt003.requestQuery>;
type ApiRnt003RequestBody = z.infer<typeof apiRnt003.requestBody>;
type ApiRnt003ResponseOK = z.infer<(typeof apiRnt003.responseBodyMap)[200]>;

export default apiRnt003;

export type {
  ApiRnt003RequestParam,
  ApiRnt003RequestQuery,
  ApiRnt003RequestBody,
  ApiRnt003ResponseOK,
};
