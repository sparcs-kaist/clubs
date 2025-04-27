import { registry } from "@clubs/interface/open-api";

export * from "./endpoint/apiAct001";
export { default as apiAct001 } from "./endpoint/apiAct001";
export * from "./endpoint/apiAct002";
export { default as apiAct002 } from "./endpoint/apiAct002";
export * from "./endpoint/apiAct003";
export { default as apiAct003 } from "./endpoint/apiAct003";
export * from "./endpoint/apiAct004";
export { default as apiAct004 } from "./endpoint/apiAct004";
export * from "./endpoint/apiAct005";
export { default as apiAct005 } from "./endpoint/apiAct005";
export * from "./endpoint/apiAct006";
export { default as apiAct006 } from "./endpoint/apiAct006";
export * from "./endpoint/apiAct007";
export { default as apiAct007 } from "./endpoint/apiAct007";
export * from "./endpoint/apiAct008";
export { default as apiAct008 } from "./endpoint/apiAct008";
export * from "./endpoint/apiAct009";
export { default as apiAct009 } from "./endpoint/apiAct009";
export * from "./endpoint/apiAct010";
export { default as apiAct010 } from "./endpoint/apiAct010";
export * from "./endpoint/apiAct011";
export { default as apiAct011 } from "./endpoint/apiAct011";
export * from "./endpoint/apiAct012";
export * from "./endpoint/apiAct013";
export * from "./endpoint/apiAct014";
export * from "./endpoint/apiAct015";
export * from "./endpoint/apiAct016";
export * from "./endpoint/apiAct017";
export * from "./endpoint/apiAct018";
export * from "./endpoint/apiAct019";
export * from "./endpoint/apiAct020";
export * from "./endpoint/apiAct023";

registry.registerPath({
  tags: ["activity"],
  method: "head",
  path: "/#/Activity",
  summary: "ACT-???: 동아리 활동(Activity)에 관한 도메인 설명",
  description: `
  TODO: 동아리 활동(Activity)에 관한 도메인 설명 추가하기
  `,
  responses: {},
});
