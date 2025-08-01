import { registry } from "@clubs/interface/open-api";

export * from "./apiSem001";
export { default as apiSem001 } from "./apiSem001";

export * from "./apiSem002";
export * from "./apiSem003";
export * from "./apiSem004";
export * from "./apiSem005";

registry.registerPath({
  tags: ["semester"],
  method: "head",
  path: "/#/Semester",
  summary: "SEM-???: 학기에 관한 도메인 설명",
  description: `
  TODO: 학기에 관한 도메인 설명 추가하기
  `,
  responses: {},
});
