import type { TransactionHost } from "@nestjs-cls/transactional";
import type { Prisma } from "@prisma/client";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/domain/club/club-delegate-change-request";

import type { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import { StudentRepository } from "@sparcs-clubs/api/feature/user/repository/student.repository";

import { ClubRepository } from "./club.repository";

// acquireLock uses the caller's transaction directly.
const clubs = new ClubRepository();
const students = new StudentRepository();

export async function lockDelegateStudent(
  txHost: TransactionHost<PrismaTransactionalAdapter>,
  studentId: number,
): Promise<void> {
  await students.acquireLock(txHost.tx, { id: studentId });
}

export async function lockClubDelegates(
  txHost: TransactionHost<PrismaTransactionalAdapter>,
  clubId: number,
  studentId?: number,
  additionalStudentId?: number,
): Promise<void> {
  // Stable rows also protect a vacant role and a student with no role.
  await clubs.acquireLock(txHost.tx, { id: clubId });
  const studentIds = [
    ...new Set(
      [studentId, additionalStudentId].filter(
        (id): id is number => id !== undefined,
      ),
    ),
  ].sort((left, right) => left - right);
  await studentIds.reduce(async (previousLock, id) => {
    await previousLock;
    await lockDelegateStudent(txHost, id);
  }, Promise.resolve());
}

export async function cancelPendingDelegateRequests(
  txHost: TransactionHost<PrismaTransactionalAdapter>,
  clubId: number,
  now: Date,
  filter?: Prisma.ClubDelegateChangeRequestWhereInput,
): Promise<void> {
  await txHost.tx.clubDelegateChangeRequest.updateMany({
    where: {
      ...filter,
      clubId,
      clubDelegateChangeRequestStatusEnumId:
        ClubDelegateChangeRequestStatusEnum.Applied,
      deletedAt: null,
    },
    data: { deletedAt: now },
  });
}
