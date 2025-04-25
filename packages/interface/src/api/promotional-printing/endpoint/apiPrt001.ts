import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  PromotionalPrintingOrderStatusEnum,
  PromotionalPrintingSizeEnum,
} from "@clubs/interface/common/enum/promotionalPrinting.enum";

/**
 * @version v0.1
 * @description 현재 학기 출력 해당 동아리의 홍보물 신청 내역을 가져옵니다.
 */

const url = () => `/student/promotional-printings/orders`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  clubId: z.coerce.number().min(1),
  startDate: z.date().optional(),
  endTerm: z.date().optional(),
  pageOffset: z.coerce.number().min(1),
  itemCount: z.coerce.number().min(1),
});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        id: z.coerce.number().int().min(1),
        studentName: z.string(),
        status: z.nativeEnum(PromotionalPrintingOrderStatusEnum),
        orders: z.array(
          z.object({
            promotionalPrintingSizeEnum: z.nativeEnum(
              PromotionalPrintingSizeEnum,
            ),
            numberOfPrints: z.coerce.number().min(1),
          }),
        ),
        desiredPickUpDate: z.date(),
        pickUpTime: z.optional(z.date()),
        createdAt: z.date(),
      }),
    ),
    total: z.coerce.number().int().min(0),
    offset: z.coerce.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiPrt001 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiPrt001RequestParam = z.infer<typeof apiPrt001.requestParam>;
type ApiPrt001RequestQuery = z.infer<typeof apiPrt001.requestQuery>;
type ApiPrt001RequestBody = z.infer<typeof apiPrt001.requestBody>;
type ApiPrt001ResponseOk = z.infer<(typeof apiPrt001.responseBodyMap)[200]>;

export default apiPrt001;

export type {
  ApiPrt001RequestParam,
  ApiPrt001RequestQuery,
  ApiPrt001RequestBody,
  ApiPrt001ResponseOk,
};
