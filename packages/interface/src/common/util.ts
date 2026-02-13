// ============================================================================
// Timezone handling is now managed server-side by Prisma middleware.
// These functions simply convert string values to Date objects.
// No manual KST offset adjustment is needed.
// ============================================================================

/**
 * Convert a string or Date input to a Date object.
 * Used for parsing date values from API responses and form inputs.
 */
export function toDate(input?: string | Date): Date {
  if (input === undefined) return new Date();
  if (typeof input === "string") return new Date(input);
  return new Date(input);
}

/**
 * @deprecated Use toDate instead. Kept for backward compatibility.
 */
export const toKSTDate = toDate;

/**
 * Zod preprocessor: converts string date values to Date objects.
 * Used in z.preprocess(getKSTDate, z.date()) patterns.
 */
export function getKSTDate(val: unknown) {
  if (typeof val === "string") {
    return new Date(val);
  }
  return val;
}
