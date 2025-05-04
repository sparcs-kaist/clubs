import { restApiConfig } from "@clubs/eslint-config/rest-api";

export default [
  {
    ignores: ["eslint.config.mjs"],
  },
  ...restApiConfig,
];
