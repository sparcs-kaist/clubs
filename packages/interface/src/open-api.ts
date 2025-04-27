import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

export function generateOpenAPI(): ReturnType<
  OpenApiGeneratorV31["generateDocument"]
> {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Clubs API",
      version: "0.1.1",
      description: "API for SPARCS Clubs",
    },
    tags: [
      {
        name: "activity",
        description: "활동 보고서 관리 API",
      },
      {
        name: "club",
        description: "동아리 관리 API",
      },
      {
        name: "member-registration",
        description: "동아리 가입 신청 관리 API",
      },
      {
        name: "funding",
        description: "지원금 신청 관리 API",
      },
    ],
  });
}
