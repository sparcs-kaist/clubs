import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { SemesterD } from "@sparcs-clubs/api/drizzle/schema/semester.schema";

@Injectable()
export class SemesterSQLRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}
  // This class is a placeholder for the SemesterRepository.
  // It can be extended with methods to interact with the database
  // for semester-related operations.

  async findSemesterByNameAndYear(key: {
    name: string;
    year: number;
  }): Promise<{ id: number | undefined }> {
    const result = await this.db
      .select()
      .from(SemesterD)
      .where(
        and(
          eq(SemesterD.name, key.name),
          eq(SemesterD.year, key.year),
          isNull(SemesterD.deletedAt),
        ),
      );

    return {
      id: result.length > 0 ? result[0].id : undefined,
    };
  }

  async insertSemester(value: {
    year: number;
    name: string;
    startTerm: Date;
    endTerm: Date;
  }): Promise<{ id: number }> {
    const _ = await this.db.insert(SemesterD).values({
      year: value.year,
      name: value.name,
      startTerm: value.startTerm,
      endTerm: value.endTerm,
    });

    const result = await this.db
      .select()
      .from(SemesterD)
      .where(
        and(
          eq(SemesterD.name, value.name),
          eq(SemesterD.year, value.year),
          isNull(SemesterD.deletedAt),
        ),
      );

    return { id: result[0].id };
  }
}
