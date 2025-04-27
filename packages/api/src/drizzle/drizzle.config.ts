import type { Config } from "drizzle-kit";

import { env } from "@sparcs-clubs/api/env";

export default {
  driver: "mysql2",
  out: "./src/drizzle/migration",
  schema: "./src/drizzle/schema/*",
  dbCredentials: {
    uri: env.DATABASE_URL,
  },
  // Print all statements
  verbose: true,
  // Always ask for confirmation
  strict: false,
} satisfies Config;
