import { Injectable } from "@nestjs/common";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class SemesterSQLRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSemesterByNameAndYear(key: {
    name: string;
    year: number;
  }): Promise<{ id: number | undefined }> {
    const result = await this.prisma.semesterD.findFirst({
      where: {
        name: key.name,
        year: key.year,
        deletedAt: null,
      },
    });

    return {
      id: result?.id,
    };
  }

  async insertSemester(value: {
    year: number;
    name: string;
    startTerm: Date;
    endTerm: Date;
  }): Promise<{ id: number }> {
    const created = await this.prisma.semesterD.create({
      data: {
        year: value.year,
        name: value.name,
        startTerm: value.startTerm,
        endTerm: value.endTerm,
      },
    });

    return { id: created.id };
  }

  async updateSemester(
    key: {
      name: string;
      year: number;
    },
    value: {
      startTerm: Date;
      endTerm: Date;
    },
  ): Promise<{ id: number }> {
    // Find the semester first
    const existing = await this.prisma.semesterD.findFirst({
      where: {
        name: key.name,
        year: key.year,
        deletedAt: null,
      },
    });

    await this.prisma.semesterD.updateMany({
      where: {
        name: key.name,
        year: key.year,
        deletedAt: null,
      },
      data: {
        startTerm: value.startTerm,
        endTerm: value.endTerm,
      },
    });

    return { id: existing.id };
  }

  async softDeleteSemester(key: {
    name: string;
    year: number;
  }): Promise<{ id: number }> {
    const now = new Date();

    // Find before soft deleting to return the id
    const existing = await this.prisma.semesterD.findFirst({
      where: {
        name: key.name,
        year: key.year,
        deletedAt: null,
      },
    });

    await this.prisma.semesterD.updateMany({
      where: {
        name: key.name,
        year: key.year,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    });

    return { id: existing.id };
  }
}
