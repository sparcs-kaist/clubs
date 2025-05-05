import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

// import logger from "@sparcs-clubs/api/common/util/logger";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import { ActivityClubChargedExecutive } from "@sparcs-clubs/api/drizzle/schema/activity.schema";

@Injectable()
export class OldActivityClubChargedExecutiveRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  /**
   * @param
   * @description 활동기간에 동아리 담당자 매핑을 생성합니다. 이미 해당기간에 담당자가 존재하는
   * 동아리는 update를 이용해야하며, 이 메소드를 이용하는경우 담당자가 둘 이상이 며 의도되지 않은
   * 동작을 발생시킬 수 있습니다.
   * @returns insertion의 성공 여부를 리턴합니다.
   */
  async insertActivityClubChargedExecutive(param: {
    activityDId: number;
    clubId: number;
    executiveId?: number | undefined;
  }): Promise<boolean> {
    const [insertResult] = await this.db
      .insert(ActivityClubChargedExecutive)
      .values({
        activityDId: param.activityDId,
        clubId: param.clubId,
        executiveId: param.executiveId,
      });

    return insertResult.affectedRows >= 1;
  }

  /**
   * @param acitvityDId 활동기간 아이디를 받습니다.
   * @param clubId 동아리 아이디를 받습니다.
   * @returns 해당 활동기간 해당 동아리의 활동보고서 당당 집행부원을 리턴합니다.
   * 담당자가 존재하징 않을 수 있습니다. 리턴은 배열 형태이며, 배열의 길이는 1 이하여야 합니다.
   */
  async selectActivityClubChargedExecutiveByClubId(param: {
    activityDId: number;
    clubId: number;
  }) {
    const result = await this.db
      .select()
      .from(ActivityClubChargedExecutive)
      .where(
        and(
          eq(ActivityClubChargedExecutive.activityDId, param.activityDId),
          eq(ActivityClubChargedExecutive.clubId, param.clubId),
          isNull(ActivityClubChargedExecutive.deletedAt),
        ),
      );
    return result;
  }

  /**
   * @description 이미 담당자가 존재하는 동아리에 대해 담당자를 변경합니다.
   * @param param
   * @returns 변경의 성공여부를 리턴합니다.
   */
  async updateActivityClubChargedExecutive(param: {
    activityDId: number;
    clubId: number;
    executiveId?: number | undefined;
  }): Promise<boolean> {
    const [updateResult] = await this.db
      .update(ActivityClubChargedExecutive)
      .set({
        executiveId: param.executiveId,
      })
      .where(
        and(
          eq(ActivityClubChargedExecutive.activityDId, param.activityDId),
          eq(ActivityClubChargedExecutive.clubId, param.clubId),
          isNull(ActivityClubChargedExecutive.deletedAt),
        ),
      );

    return updateResult.affectedRows >= 1;
  }
}
