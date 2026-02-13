import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { MFile } from "../model/file.model";

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    name: string,
    extension: string,
    size: number,
    signedAt: Date,
    userId: number,
  ) {
    const file = await this.prisma.file.create({
      data: {
        id: randomUUID(),
        name,
        extension,
        size,
        signedAt,
        userId,
      },
    });
    return file.id;
  }

  async findById(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });
    return file;
  }

  async findByIds(ids: string[]): Promise<Omit<MFile, "url">[]> {
    if (ids.length === 0) {
      return [];
    }

    const files = await this.prisma.file.findMany({
      where: { id: { in: ids } },
    });

    return files.map(
      (file): Omit<MFile, "url"> => ({
        id: file.id,
        name: file.name,
        extension: file.extension,
        size: file.size,
        userId: file.userId,
        // url은 포함하지 않음
      }),
    );
  }
}
