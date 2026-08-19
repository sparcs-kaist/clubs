import { z } from "zod";

export const DB_TEXT_MAX_LENGTH = 60_000;
export const DB_TEXT_MAX_BYTES = 65_535;

const hasValidDbTextByteLength = (value: string) =>
  new TextEncoder().encode(value).length <= DB_TEXT_MAX_BYTES;

export const zDbText = z
  .string()
  .max(DB_TEXT_MAX_LENGTH)
  .refine(hasValidDbTextByteLength, {
    message: `String must be at most ${DB_TEXT_MAX_BYTES} bytes`,
  });

export const zCoercedDbText = z.coerce
  .string()
  .max(DB_TEXT_MAX_LENGTH)
  .refine(hasValidDbTextByteLength, {
    message: `String must be at most ${DB_TEXT_MAX_BYTES} bytes`,
  });
