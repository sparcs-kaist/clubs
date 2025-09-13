import { getRequestConfig } from "next-intl/server";

import { getUserLocale } from "./locale";

const NAMESPACES = ["common", "path", "main", "agree", "division", "club"];

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  const entries = await Promise.all(
    NAMESPACES.map(
      async ns =>
        [
          ns,
          (await import(`./messages/${locale}/${ns}.json`)).default,
        ] as const,
    ),
  );
  const messages: Record<string, unknown> = Object.fromEntries(entries);

  return {
    locale,
    messages,
  };
});
