import { Prisma } from "@prisma/client";

export function toReviewSnapshot(fields: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(fields)) as Prisma.InputJsonObject;
}
