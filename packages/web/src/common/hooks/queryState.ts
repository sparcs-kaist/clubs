export type QueryValue = string | number | boolean | string[];

export function readQueryValue<T extends QueryValue>(
  raw: string | null,
  fallback: T,
): T {
  if (raw === null) return fallback;
  if (typeof fallback === "string") return raw as T;
  if (typeof fallback === "number") {
    const value = Number(raw);
    return (
      /^\d+$/.test(raw) && Number.isSafeInteger(value) && value > 0
        ? value
        : fallback
    ) as T;
  }
  if (typeof fallback === "boolean") {
    if (raw === "true") return true as T;
    if (raw === "false") return false as T;
    return fallback;
  }
  try {
    const value: unknown = JSON.parse(raw);
    return (
      Array.isArray(value) && value.every(item => typeof item === "string")
        ? value
        : fallback
    ) as T;
  } catch {
    return fallback;
  }
}

export function updateQueryValue(
  href: string,
  key: string,
  value: QueryValue,
  fallback: QueryValue,
  resetPage?: string,
) {
  const url = new URL(href);
  if (JSON.stringify(value) === JSON.stringify(fallback)) {
    url.searchParams.delete(key);
  } else {
    url.searchParams.set(
      key,
      Array.isArray(value) ? JSON.stringify(value) : String(value),
    );
  }
  if (resetPage) url.searchParams.delete(resetPage);
  return `${url.pathname}${url.search}${url.hash}`;
}
