// @ts-check

/**
 * 이 설정 파일은 모노레포 전반에 적용되는 ts lint 설정 파일입니다.
 * eslint9에 관해 배우고 싶다면 아래 포스트에서 시작해 보세요!
 * https://eslint.org/blog/2022/08/new-config-system-part-1/
 * https://eslint.org/blog/2022/08/new-config-system-part-2/
 * https://eslint.org/blog/2022/08/new-config-system-part-3/
 * TODO
 * - airbnb 플러그인이 eslint9 지원을 시작하면 호환툴을 제거해야합니다
 */

// 호환툴 입니다. process.pwd()를 기준으로 레거시 익스텐션을 불러옵니다.
// // eslint8 호환툴 호환용 라인은 전부 👴 주석 달아두기
import { FlatCompat } from "@eslint/eslintrc"; // 👴
import eslint from "@eslint/js";
// 스타일과 관련된 레거시 전부 없애기 위함
import eslintPluginStylistic from "@stylistic/eslint-plugin";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"; //
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint"; // 👴

// 커스텀 룰 추가하기
import eslintPluginZodCoerce from "./custom_rules/eslint-plugin-zod-coerce.mjs";
import eslintPluginZodRequestQueryArray from "./custom_rules/eslint-plugin-zod-requestquery-array.mjs";
// 이것도 서드파티이긴한데...
const compat = new FlatCompat({});

/** 이 설정 파일도 ts server를 통해 검사하기 위해,
 * typescript-eslint에서 권장하는 tseslint.config()를 통해 flat config를 생성합니다.
 */
export const baseConfig = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended, // prettier는 없애고 stylistic으로 통합합니다.
  // eslintImportConfigs.recommended, // airbnb가 이미 설정해줘서 충돌나는듯
  compat.extends("airbnb"), // 👴 airbnb 일해라 참고로 이친구가 import rule 사용중
  // compat.extends("airbnb-typescript"), // 👴 airbnb 레포 팀? 일해라
  eslintPluginStylistic.configs["disable-legacy"], // 스타일과 관련된 설정은 prettier로 통합합니다.
  {
    ignores: [
      "/dist",
      "/node_modules",
      "**/dist/",
      "**/node_modules/",
      "**/.next/",
      "**/*.js",
      "**/.storybook/",
    ],
  },
  {
    name: "global parameter settings for all packages",
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parserOptions: {
        project: true,
      },
    },
    settings: {
      react: {
        version: "18.2.0",
      },
    },
    rules: {
      "curly": "off",
      "dot-notation": "error",
      "import/extensions": "off",
      "import/no-extraneous-dependencies": "off",
      "import/no-unresolved": "off",
      "import/prefer-default-export": "off",
      "radix": ["error", "as-needed"],
    },
  },
  {
    name: "typescript settings for all packages",
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    name: "import order settings for every packages",
    files: ["**/*.ts", "**/*.tsx", "*.mjs"],
    plugins: { "simple-import-sort": eslintPluginSimpleImportSort },
    rules: {
      "import/order": "off",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../*"],
              message:
                "Usage of relative parent imports is not allowed. Use path alias instead.",
            },
          ],
        },
      ],
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // 외부 패키지들을 가장 먼저 import합니다.
            ["^"],
            // domain, interface, web, api 순으로 import합니다.
            ["^@clubs/domain"],
            ["^@clubs/interface"],
            ["^@sparcs-clubs/web"],
            ["^@sparcs-clubs/api"],
            // 상대경로로 import합니다.
            ["^\\."],
          ],
        },
      ],
    },
  },
  {
    name: "zod custom rules enforce coerce",
    plugins: {
      "eslint-plugin-zod-coerce": eslintPluginZodCoerce,
    },
    rules: {
      "eslint-plugin-zod-coerce/z-number": "error",
    },
  },
  {
    name: "zod custom rules enforce zQueryArray",
    files: ["**/src/api/**/endpoint/*.ts"],
    plugins: {
      "eslint-plugin-zod-requestquery-array": eslintPluginZodRequestQueryArray,
    },
    rules: {
      "eslint-plugin-zod-requestquery-array/enforce-zqueryrequest-array":
        "error",
    },
  },
);
