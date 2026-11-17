import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["local", "development", "production", "test"]),
  SERVER_PORT: z.coerce.number(),
  SECRET_KEY: z.string(),
  DATABASE_URL: z.string(),
  TEST_DATABASE_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  CLIENT_PORT: z.string().optional(),
  SSO_CLIENT_ID: z.string().optional(),
  SSO_SECRET_KEY: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().optional(),
  ACCESS_TOKEN_SECRET_KEY: z.string().optional(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().optional(),
  REFRESH_TOKEN_SECRET_KEY: z.string().optional(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().optional(),
  USER_SID: z.string().optional(),
  USER_V2_STD_NO: z.string().optional(),
  USER_V2_EMAIL: z.string().optional(),
  USER_V2_USER_NM: z.string().optional(),
  USER_V2_SOCPS_CD: z.string().optional(),
  USER_V2_STD_DEPT_ID: z.string().optional(),
  USER_V2_KAIST_UID: z.string().optional(),
  USER_V2_USER_ID: z.string().optional(),
  USER_V2_EMP_DEPT_ID: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): AppEnv => {
  const env = envSchema.parse(config);

  if (env.NODE_ENV === "test") {
    if (!env.TEST_DATABASE_URL) {
      throw new Error(
        "`TEST_DATABASE_URL` Environment Variable is not set. Please Set `TEST_DATABASE_URL` in `.env` file.",
      );
    }
    env.DATABASE_URL = env.TEST_DATABASE_URL;
  }

  return env;
};

export const env = validateEnv(process.env);

export const getSsoConfig = () => ({
  ssoClientId: env.SSO_CLIENT_ID,
  ssoSecretKey: env.SSO_SECRET_KEY,
});
