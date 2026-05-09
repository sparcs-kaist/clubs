import { nextJsConfig } from "@clubs/eslint-config/next-js";

export default [
  {
    ignores: ["*.mjs"],
  },
  ...nextJsConfig,
];
