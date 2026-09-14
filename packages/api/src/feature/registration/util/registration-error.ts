import { Prisma } from "@prisma/client";

export const isClubNameConflict = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2010") return false;

  const databaseCode = error.meta?.code;
  const databaseMessage = String(error.meta?.message ?? "");
  const isDuplicate = databaseCode === "1062";
  const isClubName = /name_(kr|en)/.test(databaseMessage);
  const isConflict = isDuplicate && isClubName;
  return isConflict;
};
