import { Injectable } from "@nestjs/common";
import { TransactionHost } from "@nestjs-cls/transactional";

import { PrismaTransactionalAdapter } from "@sparcs-clubs/api/common/transaction/transaction.type";
import { withDeleted } from "@sparcs-clubs/api/common/util/soft-delete";
import { takeOne } from "@sparcs-clubs/api/common/util/util";

@Injectable()
export class UserLoginIdentityRepository {
  constructor(
    private readonly txHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  findUserByEmail(email: string) {
    return this.txHost.tx.user
      .findMany({ where: { email, deletedAt: null } })
      .then(takeOne);
  }

  findUserById(id: number) {
    return this.txHost.tx.user
      .findMany({ where: { id, deletedAt: null } })
      .then(takeOne);
  }

  findStudentByNumber(number: number) {
    return this.txHost.tx.student
      .findMany({ where: { number, deletedAt: null } })
      .then(takeOne);
  }

  findStudentsByUserId(userId: number) {
    return this.txHost.tx.student.findMany({
      where: { userId, deletedAt: null },
    });
  }

  findProfessorByUserId(userId: number) {
    return this.txHost.tx.professor
      .findMany({ where: { userId, deletedAt: null } })
      .then(takeOne);
  }

  findEmployeeByUserId(userId: number) {
    return this.txHost.tx.employee
      .findMany({ where: { userId, deletedAt: null } })
      .then(takeOne);
  }

  findExecutiveByUserId(userId: number) {
    return this.txHost.tx.executive
      .findMany({ where: { userId, deletedAt: null } })
      .then(takeOne);
  }

  findCurrentStudentTerms(studentIds: number[], queriedAt: Date) {
    return this.txHost.tx.studentT.findMany({
      where: {
        studentId: { in: studentIds },
        startTerm: { lte: queriedAt },
        OR: [{ endTerm: null }, { endTerm: { gte: queriedAt } }],
        deletedAt: null,
      },
      orderBy: [{ startTerm: "desc" }, { id: "desc" }],
      select: { studentId: true, studentEnum: true },
    });
  }

  ensureUser(data: { sid: string; name: string; email: string }) {
    const update = { name: data.name, email: data.email };
    return this.txHost.tx.user.upsert({
      where: withDeleted({ sid: data.sid }),
      create: data,
      update,
    });
  }

  ensureStudent(data: {
    name: string;
    number: number;
    userId: number;
    email: string;
  }) {
    const update = { userId: data.userId, name: data.name, email: data.email };
    return this.txHost.tx.student.upsert({
      where: withDeleted({ number: data.number }),
      create: data,
      update,
    });
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
    return this.txHost.tx.studentT.upsert({
      where: withDeleted({
        studentId_semesterId: {
          studentId: data.studentId,
          semesterId: data.semesterId,
        },
      }),
      create: data,
      update,
    });
  }

  ensureProfessor(data: { userId: number; name: string; email: string }) {
    const update = { userId: data.userId, name: data.name };
    return this.txHost.tx.professor.upsert({
      where: withDeleted({ email: data.email }),
      create: data,
      update,
    });
  }

  ensureProfessorTerm(data: {
    professorId: number;
    department: number | null;
    startTerm: Date;
  }) {
    return this.txHost.tx.professorT.upsert({
      where: withDeleted({ professorId: data.professorId }),
      create: { ...data, professorEnum: 3 },
      update: data,
    });
  }

  ensureEmployee(data: { userId: number; name: string; email: string }) {
    // Employee has no unique key on userId/email; the existing INSERT creates
    // a row on every login. Preserve that behavior during this migration.
    return this.txHost.tx.employee.create({ data });
  }

  ensureEmployeeTerm(data: { employeeId: number; startTerm: Date }) {
    return this.txHost.tx.employeeT.upsert({
      where: withDeleted({ employeeId: data.employeeId }),
      create: data,
      update: data,
    });
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
