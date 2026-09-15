import { Injectable } from "@nestjs/common";

import { withDeleted } from "@sparcs-clubs/api/common/util/soft-delete";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class UserOverviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  findStudents(studentIds: number[], semesterId: number) {
    // Historical reports retain the identity attached to the selected term.
    return this.prisma.student.findMany({
      where: withDeleted({ id: { in: studentIds } }),
      select: {
        id: true,
        number: true,
        name: true,
        email: true,
        user: { select: { name: true, phoneNumber: true } },
        studentTs: {
          where: { semesterId, deletedAt: null },
          select: { department: true },
          take: 1,
        },
      },
    });
  }

  findProfessors(professorIds: number[]) {
    // The report explicitly hides deleted professors after joining by ID.
    return this.prisma.professor.findMany({
      where: withDeleted({ id: { in: professorIds } }),
      select: {
        id: true,
        deletedAt: true,
        name: true,
        user: { select: { name: true } },
      },
    });
  }
}
