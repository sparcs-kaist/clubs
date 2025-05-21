import { HttpStatusCode } from "axios";
import { z } from "zod";

import { CommonSpaceUsageOrderStatusEnum } from "@clubs/interface/common/enum/commonSpace.enum";

/**
 * @version v0.1
 * @description 해당 동아리의 공용공간 사용신청 내역을 가져옵니다.
 */

const url = () => `/student/common-spaces/orders`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z
  .object({
    clubId: z.coerce.number().min(1),
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
        orderId: z.coerce.number().int().min(1),
        // 상태에 관한 prop이 없어서 임의로 추가했습니다. 리뷰하실 때 시트와 함께 검토해 주세요!
        statusEnum: z.nativeEnum(CommonSpaceUsageOrderStatusEnum),
        spaceName: z.string(),
        chargeStudentName: z.string().max(255),
        startTerm: z.coerce.date(), // Assuming startTerm is a datetime
        endTerm: z.coerce.date(), // Assuming endTerm is a datetime
        createdAt: z.coerce.date(), // Assuming createdAt is a datetime
      }),
    ),
    total: z.coerce.number().int().min(0),
    offset: z.coerce.number().int().min(1),
  }),
};

const responseErrorMap = {};

const apiCms006 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiCms006RequestParam = z.infer<typeof apiCms006.requestParam>;
type ApiCms006RequestQuery = z.infer<typeof apiCms006.requestQuery>;
type ApiCms006RequestBody = z.infer<typeof apiCms006.requestBody>;
type ApiCms006ResponseOk = z.infer<(typeof apiCms006.responseBodyMap)[200]>;

export default apiCms006;

export type {
  ApiCms006RequestParam,
  ApiCms006RequestQuery,
  ApiCms006RequestBody,
  ApiCms006ResponseOk,
};
