import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["local", "development", "production", "test"]),
  SERVER_PORT: z.coerce.number(),
  SECRET_KEY: z.string(),
  DATABASE_URL: z.string(),
  TEST_DATABASE_URL: z.string(),
});

const getSsoConfig = () => ({
  ssoClientId: process.env.SSO_CLIENT_ID,
  ssoSecretKey: process.env.SSO_SECRET_KEY,
});

const env = schema.parse(process.env);
if (env.NODE_ENV === "test") {
  env.DATABASE_URL = env.TEST_DATABASE_URL;
}

export { env, getSsoConfig };
