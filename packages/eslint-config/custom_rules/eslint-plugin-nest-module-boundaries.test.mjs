import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";

import eslintPluginNestModuleBoundaries from "./eslint-plugin-nest-module-boundaries.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parser: tseslint.parser,
  },
});

ruleTester.run(
  "public-service-exports-only",
  eslintPluginNestModuleBoundaries.rules["public-service-exports-only"],
  {
    valid: [
      {
        filename: "src/feature/activity/activity.module.ts",
        code: `
import { Module } from "@nestjs/common";

@Module({
  exports: [ActivityPublicService, ActivityDurationPublicService],
})
export class ActivityModule {}
`,
      },
      {
        filename: "src/feature/funding/funding.module.ts",
        code: `
import { Module } from "@nestjs/common";

@Module({
  exports: [],
})
export class FundingModule {}
`,
      },
      {
        filename: "src/common/app.module.ts",
        code: `
import { Module } from "@nestjs/common";

@Module({
  exports: [AppService],
})
export class AppModule {}
`,
      },
    ],
    invalid: [
      {
        filename: "src/feature/activity/activity.module.ts",
        code: `
import { Module } from "@nestjs/common";

@Module({
  exports: [ActivityRepository],
})
export class ActivityModule {}
`,
        errors: [{ messageId: "usePublicService" }],
      },
      {
        filename: "src/feature/activity/activity.module.ts",
        code: `
import { Module } from "@nestjs/common";

@Module({
  exports: [ActivityService],
})
export class ActivityModule {}
`,
        errors: [{ messageId: "usePublicService" }],
      },
      {
        filename: "src/feature/activity/activity.module.ts",
        code: `
import { Module } from "@nestjs/common";

@Module({
  exports: moduleExports,
})
export class ActivityModule {}
`,
        errors: [{ messageId: "useStaticExports" }],
      },
    ],
  },
);
