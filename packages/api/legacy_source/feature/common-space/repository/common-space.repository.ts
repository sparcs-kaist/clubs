import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { CommonSpace } from "@sparcs-clubs/api/drizzle/schema/common-space.schema";

@Injectable()
export class CommonSpaceRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async getAllCommonSpaces() {
    const result = await this.db
      .select({
        id: CommonSpace.id,
        commonSpaceEnum: CommonSpace.commonSpaceEnum,
        name: CommonSpace.spaceName,
        availableHoursPerWeek: CommonSpace.availableHoursPerWeek,
        availableHoursPerDay: CommonSpace.availableHoursPerDay,
      })
      .from(CommonSpace);
    return result;
  }

  async findCommonSpaceById(id: number) {
    const result = await this.db
      .select()
      .from(CommonSpace)
      .where(eq(CommonSpace.id, id));
    if (result.length !== 1) {
      throw new HttpException("Common space not found", HttpStatus.NOT_FOUND);
    }
    return result[0];
  }
}
