// @ts-check

import { baseConfig } from "./base.mjs";

export const nextJsConfig = [
  ...baseConfig,
  {
    name: "react settings for web package",
    files: ["**/*.tsx"],
    rules: {
      "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
      "react/jsx-props-no-spreading": "off",
      "react/react-in-jsx-scope": "off",
      "react/require-default-props": "off",
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],
      "react/no-array-index-key": "off",
      "react/jsx-no-useless-fragment": [
        "error",
        {
          // this allows <>{value}</> syntax, where value is a string or a number
          allowExpressions: true,
        },
      ],
      "react/jsx-uses-react": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"],
        },
      ],
    },
    settings: {
      react: {
        version: "18.2.0",
      },
    },
  },
];
