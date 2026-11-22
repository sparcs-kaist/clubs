import { Prisma } from "@prisma/client";

const retryableWriteConflicts = new Set(["P2002", "P2034"]);

export async function retryInternalMemoWrite<T>(write: () => Promise<T>) {
  try {
    return await write();
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
    if (!retryableWriteConflicts.has(error.code)) throw error;
    // A concurrent initial upsert must retry with a fresh transaction snapshot.
    return write();
  }
}
