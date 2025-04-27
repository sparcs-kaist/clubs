// @ts-check

import eslintPluginJest from "eslint-plugin-jest";

import { baseConfig } from "./base.mjs";

export const nestJsConfig = [
  ...baseConfig,
  {
    name: "nestJS settings",
    files: ["**/*.ts"],
    plugins: {
      jest: eslintPluginJest,
    },
    languageOptions: {
      globals: eslintPluginJest.environments.globals.globals,
    },
    rules: {
      "max-classes-per-file": "off",
      "no-useless-constructor": "off",
      "no-empty-function": "off",
      "no-dupe-class-members": "off",
      "class-methods-use-this": "off",
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/prefer-to-have-length": "warn",
      "jest/valid-expect": "error",
    },
  },
  {
    name: "api-specific import rules",
    files: ["**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["src/*", "src/**/*"],
              message:
                "Importing directly from the src directory is prohibited. Please use the relative path or path alias defined in `tsconfig.json`.",
            },
          ],
        },
      ],
    },
  },
];
