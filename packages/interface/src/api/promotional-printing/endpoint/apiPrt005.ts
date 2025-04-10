import { HttpStatusCode } from "axios";
import { z } from "zod";

import {
  PromotionalPrintingOrderStatusEnum,
  PromotionalPrintingSizeEnum,
} from "@sparcs-clubs/interface/common/enum/promotionalPrinting.enum";

/**
 * @version v0.1
 * @description 현재 학기 자신의 홍보물 신청 내역을 가져옵니다
 */

const url = () => "/student/promotional-printings/orders/my";
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
        studentName: z.coerce.string(),
        status: z.nativeEnum(PromotionalPrintingOrderStatusEnum),
        orders: z.array(
          z.object({
            promotionalPrintingSizeEnum: z.nativeEnum(
              PromotionalPrintingSizeEnum,
            ),
            numberOfPrints: z.coerce.number().int().min(0),
          }),
        ),
        desiredPickUpDate: z.coerce.date(),
        pickUpTime: z.coerce.date().optional(),
        createdAt: z.coerce.date(), // timestamp를 datetime 문자열로 처리, claude가 요렇게 제안해줬는데 잘 되는지 확인해보고 싶어졌어요
      }),
    ),
    total: z.coerce.number().int().min(0),
    offset: z.coerce.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiPrt005 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiPrt005RequestParam = z.infer<typeof apiPrt005.requestParam>;
type ApiPrt005RequestQuery = z.infer<typeof apiPrt005.requestQuery>;
type ApiPrt005RequestBody = z.infer<typeof apiPrt005.requestBody>;
type ApiPrt005ResponseOk = z.infer<(typeof apiPrt005.responseBodyMap)[200]>;

export default apiPrt005;

export type {
  ApiPrt005RequestParam,
  ApiPrt005RequestQuery,
  ApiPrt005RequestBody,
  ApiPrt005ResponseOk,
};
