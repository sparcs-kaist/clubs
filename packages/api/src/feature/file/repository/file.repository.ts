import { Inject, Injectable } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { File } from "@sparcs-clubs/api/drizzle/schema/file.schema";

import { MFile } from "../model/file.model";

@Injectable()
export class FileRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async create(
    name: string,
    extension: string,
    size: number,
    signedAt: Date,
    userId: number,
  ) {
    await this.db.insert(File).values({
      name,
      extension,
      size,
      signedAt,
      userId,
    });
    const fileId = await this.db
      .select()
      .from(File)
      .where(
        and(
          eq(File.name, name),
          eq(File.signedAt, signedAt),
          eq(File.userId, userId),
        ),
      )
      .then(result => result);
    return fileId[0].id;
  }

  async findById(id: string) {
    const file = await this.db
      .select()
      .from(File)
      .where(eq(File.id, id))
      .then(result => result[0]);
    return file;
  }

  async findByIds(ids: string[]): Promise<Omit<MFile, "url">[]> {
    if (ids.length === 0) {
      return [];
    }

    const files = await this.db
      .select()
      .from(File)
      .where(inArray(File.id, ids))
      .then(result => result);

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
