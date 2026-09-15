import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";
import { Prisma } from "@prisma/client";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import { withDeleted } from "@sparcs-clubs/api/common/util/soft-delete";

async function updateAfterUniqueRace<T>(
  operation: () => Promise<T>,
  updateExisting: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
    if (error.code !== "P2002") throw error;
    // Update the winning unique key directly; another upsert may reuse a
    // transaction read snapshot that predates the concurrent insert.
    return updateExisting();
  }
}

@Injectable()
export class UserSsoLoginRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  ensureUser(data: { sid: string; name: string; email: string }) {
    const update = { name: data.name, email: data.email };
    return updateAfterUniqueRace(
      () =>
        this.txHost.tx.user.upsert({
          where: withDeleted({ sid: data.sid }),
          create: data,
          update,
        }),
      () =>
        this.txHost.tx.user.update({
          where: withDeleted({ sid: data.sid }),
          data: update,
        }),
    );
  }

  ensureStudent(data: {
    name: string;
    number: number;
    userId: number;
    email: string;
  }) {
    const update = { userId: data.userId, name: data.name, email: data.email };
    return updateAfterUniqueRace(
      () =>
        this.txHost.tx.student.upsert({
          where: withDeleted({ number: data.number }),
          create: data,
          update,
        }),
      () =>
        this.txHost.tx.student.update({
          where: withDeleted({ number: data.number }),
          data: update,
        }),
    );
  }

  ensureStudentTerm(data: {
    studentId: number;
    semesterId: number;
    startTerm: Date;
    endTerm: Date;
    studentEnum: number;
    studentStatusEnum: number;
    department: number | null;
  }) {
    const update = {
      studentEnum: data.studentEnum,
      studentStatusEnum: data.studentStatusEnum,
      department: data.department,
    };
    return updateAfterUniqueRace(
      () =>
        this.txHost.tx.studentT.upsert({
          where: withDeleted({
            studentId_semesterId: {
              studentId: data.studentId,
              semesterId: data.semesterId,
            },
          }),
          create: data,
          update,
        }),
      () =>
        this.txHost.tx.studentT.update({
          where: withDeleted({
            studentId_semesterId: {
              studentId: data.studentId,
              semesterId: data.semesterId,
            },
          }),
          data: update,
        }),
    );
  }

  ensureProfessor(data: { userId: number; name: string; email: string }) {
    const update = { userId: data.userId, name: data.name };
    return updateAfterUniqueRace(
      () =>
        this.txHost.tx.professor.upsert({
          where: withDeleted({ email: data.email }),
          create: data,
          update,
        }),
      () =>
        this.txHost.tx.professor.update({
          where: withDeleted({ email: data.email }),
          data: update,
        }),
    );
  }

  ensureProfessorTerm(data: {
    professorId: number;
    department: number | null;
    startTerm: Date;
  }) {
    return updateAfterUniqueRace(
      () =>
        this.txHost.tx.professorT.upsert({
          where: withDeleted({ professorId: data.professorId }),
          create: { ...data, professorEnum: 3 },
          update: data,
        }),
      () =>
        this.txHost.tx.professorT.update({
          where: withDeleted({ professorId: data.professorId }),
          data,
        }),
    );
  }

  ensureEmployee(data: { userId: number; name: string; email: string }) {
    // Employee has no unique key on userId/email; the existing INSERT creates
    // a row on every login. Preserve that behavior during this migration.
    return this.txHost.tx.employee.create({ data });
  }

  ensureEmployeeTerm(data: { employeeId: number; startTerm: Date }) {
    return updateAfterUniqueRace(
      () =>
        this.txHost.tx.employeeT.upsert({
          where: withDeleted({ employeeId: data.employeeId }),
          create: data,
          update: data,
        }),
      () =>
        this.txHost.tx.employeeT.update({
          where: withDeleted({ employeeId: data.employeeId }),
          data,
        }),
    );
  }

  updateExecutiveUser(studentId: number, userId: number) {
    return this.txHost.tx.executive.updateMany({
      where: withDeleted({ studentId }),
      data: { userId },
    });
  }

  findActiveExecutives(studentId: number, queriedAt: Date) {
    return this.txHost.tx.executive.findMany({
      where: {
        studentId,
        deletedAt: null,
        executiveTs: {
          some: {
            startTerm: { lte: queriedAt },
            OR: [{ endTerm: null }, { endTerm: { gte: queriedAt } }],
            deletedAt: null,
          },
        },
      },
      select: { id: true, studentId: true },
      take: 1,
    });
  }
}
