import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["local", "development", "production", "test"]),
  SERVER_PORT: z.coerce.number(),
  SECRET_KEY: z.string(),
  DATABASE_URL: z.string(),
  TEST_DATABASE_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

const getSsoConfig = () => ({
  ssoClientId: process.env.SSO_CLIENT_ID,
  ssoSecretKey: process.env.SSO_SECRET_KEY,
});

const env = schema.parse(process.env);
if (env.NODE_ENV === "test") {
  if (!env.TEST_DATABASE_URL) {
    throw new Error(
      "`TEST_DATABASE_URL` Environment Variable is not set. Please Set `TEST_DATABASE_URL` in `.env` file.",
    );
  }
  env.DATABASE_URL = env.TEST_DATABASE_URL;
}

export { env, getSsoConfig };
