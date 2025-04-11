import { nestJsConfig } from "@clubs/eslint-config/nest-js";

export default [
  {
    ignores: ["eslint.config.mjs"],
  },
  ...nestJsConfig,
];
