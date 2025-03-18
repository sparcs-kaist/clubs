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
      version: "0.1",
      description: "API for SPARCS Clubs",
    },
  });
}
