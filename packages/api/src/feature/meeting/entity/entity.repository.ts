import {
  // HttpException, HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, eq, isNull, or } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { MeetingAgendaEntityTypeEnum } from "@clubs/interface/common/enum/meeting.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
// import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import {
  MeetingAgendaContent,
  MeetingAgendaVote,
  MeetingMapping,
} from "@sparcs-clubs/api/drizzle/schema/meeting.schema";

@Injectable()
export class EntityRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async putMeetingAgendaEntities(
    userId: number,
    meetingId: number,
    agendaId: number,
    entityIdList: Array<{ id: number; meetingAgendaEntityType: number }>,
  ) {
    await this.db.transaction(async tx => {
      const updatePromises = entityIdList.map(
        ({ id, meetingAgendaEntityType }, index) =>
          tx
            .update(MeetingMapping)
            .set({ meetingAgendaEntityPosition: index + 1 })
            .where(
              or(
                and(
                  // 1. If entity is content
                  eq(MeetingMapping.meetingAgendaId, agendaId),
                  eq(MeetingMapping.meetingId, meetingId),
                  eq(
                    MeetingMapping.meetingAgendaEntityType,
                    meetingAgendaEntityType,
                  ),
                  eq(MeetingMapping.meetingAgendaContentId, id),
                  isNull(MeetingMapping.deletedAt),
                ),
                and(
                  // 2. If entity is vote
                  eq(MeetingMapping.meetingAgendaId, agendaId),
                  eq(MeetingMapping.meetingId, meetingId),
                  eq(
                    MeetingMapping.meetingAgendaEntityType,
                    meetingAgendaEntityType,
                  ),
                  eq(MeetingMapping.meetingAgendaVoteId, id),
                  isNull(MeetingMapping.deletedAt),
                ),
              ),
            )
            .then(result => {
              if (result[0].affectedRows === 0) {
                logger.warn(
                  `[EntityRepository] No MeetingMapping found for meeting ID: ${meetingId} and agenda ID: ${agendaId} and entity ID: ${id}`,
                );
              }
            }),
      );

      await Promise.all(updatePromises);
    });

    logger.debug(
      `[EntityRepository] Modified entity position order ${meetingId}, ${agendaId}`,
    );
    return true;
  }

  async getMeetingAgendaEntities(
    userId: number,
    meetingId: number,
    agendaId: number,
  ): Promise<
    {
      meetingAgendaEntityTypeEnum: MeetingAgendaEntityTypeEnum;
      content?: string;
      title?: string;
      description?: string;
    }[]
  > {
    const getContents = await this.db
      .select({
        meetingAgendaEntityTypeEnum: MeetingMapping.meetingAgendaEntityType,
        content: MeetingAgendaContent.content,
        position: MeetingMapping.meetingAgendaEntityPosition,
      })
      .from(MeetingMapping)
      .innerJoin(
        MeetingAgendaContent,
        eq(MeetingAgendaContent.id, MeetingMapping.meetingAgendaContentId),
      )
      .where(
        and(
          eq(MeetingMapping.meetingId, meetingId),
          eq(MeetingMapping.meetingAgendaId, agendaId),
          eq(MeetingMapping.meetingAgendaEntityType, 1),
          isNull(MeetingMapping.deletedAt),
        ),
      );

    const getVotes = await this.db
      .select({
        meetingAgendaEntityTypeEnum: MeetingMapping.meetingAgendaEntityType,
        title: MeetingAgendaVote.title,
        description: MeetingAgendaVote.description,
        position: MeetingMapping.meetingAgendaEntityPosition,
      })
      .from(MeetingMapping)
      .innerJoin(
        MeetingAgendaVote,
        eq(MeetingAgendaVote.id, MeetingMapping.meetingAgendaVoteId),
      )
      .where(
        and(
          eq(MeetingMapping.meetingId, meetingId),
          eq(MeetingMapping.meetingAgendaId, agendaId),
          eq(MeetingMapping.meetingAgendaEntityType, 2),
          isNull(MeetingMapping.deletedAt),
        ),
      );

    const mergedArray = [...getVotes, ...getContents].sort(
      (a, b) => a.position - b.position,
    );

    const items = mergedArray.map(({ position: _, ...rest }) => ({
      meetingAgendaEntityTypeEnum: rest.meetingAgendaEntityTypeEnum,
      content: "content" in rest ? rest.content : undefined,
      title: "title" in rest ? rest.title : undefined,
      description: "description" in rest ? rest.description : undefined,
    }));

    return items;
  }
}
