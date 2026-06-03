import { RuleTester } from "eslint";

import eslintPluginInjectableRuntimeDependencies from "./eslint-plugin-injectable-runtime-dependencies.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

ruleTester.run(
  "no-direct-runtime-source",
  eslintPluginInjectableRuntimeDependencies.rules["no-direct-runtime-source"],
  {
    valid: [
      {
        code: "const parsed = new Date(input);",
        filename: "src/feature/foo/foo.service.ts",
      },
      {
        code: "export class SystemClock { now() { return new Date(); } }",
        filename: "src/common/clock/system-clock.ts",
      },
      {
        code: "export class SystemRandomGenerator { uuid() { return randomUUID(); } }",
        filename: "src/common/random/system-random-generator.ts",
      },
      {
        code: "const schema = z.object({ NODE_ENV: z.string() }); schema.parse(process.env);",
        filename: "src/env.ts",
      },
      {
        code: "const schema = z.object({ NODE_ENV: z.string() }); schema.parse(process.env);",
        filename: "src/config/env.ts",
      },
    ],
    invalid: [
      {
        code: "const now = new Date();",
        filename: "src/feature/foo/foo.service.ts",
        errors: [{ messageId: "useClock" }],
      },
      {
        code: "const millis = Date.now();",
        filename: "src/feature/foo/foo.service.ts",
        errors: [{ messageId: "useClock" }],
      },
      {
        code: "const id = randomUUID();",
        filename: "src/feature/foo/foo.repository.ts",
        errors: [{ messageId: "useRandomGenerator" }],
      },
      {
        code: "const secret = crypto.randomBytes(5).toString('hex');",
        filename: "src/feature/foo/foo.service.ts",
        errors: [{ messageId: "useRandomGenerator" }],
      },
      {
        code: "const bucket = process.env.S3_BUCKET_NAME;",
        filename: "src/feature/file/file.service.ts",
        errors: [{ messageId: "useConfig" }],
      },
      {
        code: "const parsed = schema.parse(process.env);",
        filename: "src/feature/foo/foo.service.ts",
        errors: [{ messageId: "useConfig" }],
      },
      {
        code: "const value = process.env[key];",
        filename: "src/feature/foo/foo.service.ts",
        errors: [{ messageId: "useConfig" }],
      },
    ],
  },
);
