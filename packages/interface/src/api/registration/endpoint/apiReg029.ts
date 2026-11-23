import { registry } from "@clubs/interface/open-api";

import apiReg011 from "./apiReg011";

const baseUrl = "/student/registrations/club-registrations/my/previous";
export const ApiReg029RequestUrl = `${baseUrl}/:applyId`;

// 이전 학기 신청서도 기존 상세 응답을 사용합니다.
const apiReg029 = {
  ...apiReg011,
  url: (applyId: number) => `${baseUrl}/${applyId}`,
};

export default apiReg029;

registry.registerPath({
  tags: ["club-registration"],
  method: "get",
  path: `${baseUrl}/{applyId}`,
  summary: "REG-029 직전 학기 동아리 등록 신청서 열람",
  description:
    "신청자 본인 또는 같은 동아리의 현재 대표자·대의원만 열람할 수 있습니다.",
  request: { params: apiReg029.requestParam },
  responses: {
    200: {
      description: "직전 학기 동아리 등록 신청서",
      content: {
        "application/json": { schema: apiReg029.responseBodyMap[200] },
      },
    },
    404: { description: "열람 가능한 신청서가 없음" },
  },
});
