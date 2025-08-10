import { registry } from "@clubs/interface/open-api";

export * from "./apiSem001";
export { default as apiSem001 } from "./apiSem001";

export * from "./apiSem002";
export * from "./apiSem003";
export * from "./apiSem004";
export * from "./apiSem005";

export * from "./apiSem006";
export * from "./apiSem007";
export * from "./apiSem008";
export * from "./apiSem009";
export * from "./apiSem010";

export * from "./apiSem011";
export * from "./apiSem012";
export * from "./apiSem013";
export * from "./apiSem014";

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
