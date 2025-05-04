import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  PromotionalPrintingOrderStatusEnum,
  PromotionalPrintingSizeEnum,
} from "@clubs/interface/common/enum/promotionalPrinting.enum";

/**
 * @version v0.1
 * @description 한 개의 홍보물 출력 신청 내역을 조회합니다. 신청자 본인 또는 동아리 대표자만 조회 가능합니다.
 */

const url = (orderId: string) =>
  `/promotional-printings/orders/order/${orderId}`;
const method = "GET";

const requestParam = z.object({
  orderId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    order: z.object({
      clubId: z.coerce.number().int().min(1),
      studentId: z.coerce.number().int().min(1),
      status: z.nativeEnum(PromotionalPrintingOrderStatusEnum),
      orders: z.array(
        z.object({
          promotionalPrintingSizeEnum: z.nativeEnum(
            PromotionalPrintingSizeEnum,
          ),
          numberOfPrints: z.coerce.number().int().min(1), // 0보다 큰 정수
        }),
      ),
      isColorPrint: z.boolean(),
      fitPrintSizeToPaper: z.boolean(),
      requireMarginChopping: z.boolean(),
      desiredPickUpDate: z.coerce.date(),
      createdAt: z.coerce.date(), // timestamp를 datetime 문자열로 처리
    }),
  }),
};

const responseErrorMap = {};

const apiPrt003 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiPrt003RequestParam = z.infer<typeof apiPrt003.requestParam>;
type ApiPrt003RequestQuery = z.infer<typeof apiPrt003.requestQuery>;
type ApiPrt003RequestBody = z.infer<typeof apiPrt003.requestBody>;
type ApiPrt003ResponseOk = z.infer<(typeof apiPrt003.responseBodyMap)[200]>;

export default apiPrt003;

export type {
  ApiPrt003RequestParam,
  ApiPrt003RequestQuery,
  ApiPrt003RequestBody,
  ApiPrt003ResponseOk,
};
