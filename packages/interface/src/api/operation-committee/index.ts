import { registry } from "@clubs/interface/open-api";

export * from "./apiOpC001";
export * from "./apiOpC002";
export * from "./apiOpC003";

registry.registerPath({
  tags: ["operation-committee"],
  method: "head",
  path: "/#/OperationCommittee",
  summary: "OPC-???: 운영위원 도메인 설명",
  description: `
    운영위원 도메인에 관련된 엔드포인트를 관리합니다.
    - 비밀키 생성, 조회, 삭제
  `,
  responses: {},
});
