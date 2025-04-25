import { HttpStatusCode } from "axios";
import { z } from "zod";

import { PromotionalPrintingSizeEnum } from "@clubs/interface/common/enum/promotionalPrinting.enum";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

/**
 * @version v0.1
 * @description 홍보물 출력을 신청합니다
 */

const url = (clubId: string) =>
  `/student/promotional-printings/orders/order/${clubId}`;
const method = "POST";

const requestParam = z.object({
  clubId: z.coerce.number().int().min(1),
});

const requestQuery = z.object({});

const requestBody = z.object({
  documentFileLink: z.coerce.string(),
  krPhoneNumber: zKrPhoneNumber, // 예시에 따라서 유효성 검사를 위한 정확한 패턴을 추가해야 합니다.
  orders: z
    .object({
      promotionalPrintingSizeEnum: z.coerce
        .number()
        .int()
        .min(1)
        .pipe(z.nativeEnum(PromotionalPrintingSizeEnum)),
      numberOfPrints: z.coerce.number().min(0), // 음수를 허용하지 않는 것으로 변경하고 있습니다.
    })
    .array(),
  isColorPrint: z.coerce.boolean(),
  fitPrintSizeToPaper: z.coerce.boolean(),
  requireMarginChopping: z.coerce.boolean(),
  printingPurpose: z.coerce.string().max(512),
  desiredPickUpTime: z.coerce.date(),
});

const responseBodyMap = {
  [HttpStatusCode.Created]: z.object({}),
};

const responseErrorMap = {};

const apiPrt002 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiPrt002RequestParam = z.infer<typeof apiPrt002.requestParam>;
type ApiPrt002RequestQuery = z.infer<typeof apiPrt002.requestQuery>;
type ApiPrt002RequestBody = z.infer<typeof apiPrt002.requestBody>;
type ApiPrt002ResponseCreated = z.infer<
  (typeof apiPrt002.responseBodyMap)[201]
>;

export default apiPrt002;

export type {
  ApiPrt002RequestParam,
  ApiPrt002RequestQuery,
  ApiPrt002RequestBody,
  ApiPrt002ResponseCreated,
};
