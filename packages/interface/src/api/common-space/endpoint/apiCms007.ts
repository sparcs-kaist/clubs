import { HttpStatusCode } from "axios";
import { z } from "zod";

import { CommonSpaceUsageOrderStatusEnum } from "@sparcs-clubs/interface/common/enum/commonSpace.enum";

/**
 * @version v0.1
 * @description 자신의 공용공간 사용신청 내역을 가져옵니다.
 */

const url = () => `/student/common-spaces/orders/my`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z
  .object({
    startDate: z.coerce.date().optional(),
    endTerm: z.coerce.date().optional(),
    pageOffset: z.coerce.number().min(1),
    itemCount: z.coerce.number().min(1),
  })
  .refine(
    data => {
      if (data.startDate && data.endTerm) {
        return data.startDate <= data.endTerm;
      }
      return true;
    },
    {
      message: "startDate must be same or earlier than endTerm",
      path: ["startDate", "endTerm"],
    },
  );

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        orderId: z.number().int().min(1),
        statusEnum: z.nativeEnum(CommonSpaceUsageOrderStatusEnum),
        spaceName: z.string(),
        chargeStudentName: z.string().max(255),
        startTerm: z.coerce.date(), // Assuming startTerm is a datetime
        endTerm: z.coerce.date(), // Assuming endTerm is a datetime
        createdAt: z.coerce.date(), // Assuming createdAt is a datetime
      }),
    ),
    total: z.number().int().min(0),
    offset: z.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiCms007 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiCms007RequestParam = z.infer<typeof apiCms007.requestParam>;
type ApiCms007RequestQuery = z.infer<typeof apiCms007.requestQuery>;
type ApiCms007RequestBody = z.infer<typeof apiCms007.requestBody>;
type ApiCms007ResponseOk = z.infer<(typeof apiCms007.responseBodyMap)[200]>;

export default apiCms007;

export type {
  ApiCms007RequestParam,
  ApiCms007RequestQuery,
  ApiCms007RequestBody,
  ApiCms007ResponseOk,
};
