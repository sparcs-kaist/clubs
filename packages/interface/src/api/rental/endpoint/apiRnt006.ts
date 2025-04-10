import { HttpStatusCode } from "axios";
import { z } from "zod";

import { RentalOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/rental.enum";

/**
 * @version v0.1
 * @description 내가 신청한 대여 목록을 가져옵니다
 */

const url = () => `/student/rentals/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  startDate: z.coerce.date().optional(),
  endTerm: z.coerce.date().optional(),
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        studentName: z.string(),
        objects: z.array(
          z.object({
            id: z.coerce.number().int().min(1),
            name: z.string(),
            number: z.coerce.number().int().min(1),
          }),
        ),
        statusEnum: z.nativeEnum(RentalOrderStatusEnum),
        desiredStart: z.coerce.date(),
        desiredEnd: z.coerce.date(),
        startDate: z.coerce.date().optional(),
        endTerm: z.coerce.date().optional(),
        createdAt: z.coerce.date(),
      }),
    ),
    total: z.coerce.number().int().min(0),
    offset: z.coerce.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiRnt006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiRnt006RequestParam = z.infer<typeof apiRnt006.requestParam>;
type ApiRnt006RequestQuery = z.infer<typeof apiRnt006.requestQuery>;
type ApiRnt006RequestBody = z.infer<typeof apiRnt006.requestBody>;
type ApiRnt006ResponseOK = z.infer<(typeof apiRnt006.responseBodyMap)[200]>;

export default apiRnt006;

export type {
  ApiRnt006RequestParam,
  ApiRnt006RequestQuery,
  ApiRnt006RequestBody,
  ApiRnt006ResponseOK,
};
