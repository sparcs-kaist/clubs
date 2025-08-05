import { registry } from "@clubs/interface/open-api";

export * from "./apiUsr006";
export * from "./apiUsr007";
export * from "./apiUsr008";

registry.registerPath({
  tags: ["executive"],
  method: "head",
  path: "/#/Executive",
  summary: "USR-???: 집행부원에 관한 도메인 설명",
  description: `
		집행부원에 관한 도메인입니다.
	`,
  responses: {},
});
