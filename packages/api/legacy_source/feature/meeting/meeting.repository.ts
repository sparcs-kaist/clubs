import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { and, count, eq, gte, isNull, lt, max, not, sql } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";

import { ApiMee012ResponseOk } from "@clubs/interface/api/meeting/apiMee012";
import {
  MeetingEnum,
  MeetingStatusEnum,
} from "@clubs/interface/common/enum/meeting.enum";

import logger from "@sparcs-clubs/api/common/util/logger";
import { getKSTDate } from "@sparcs-clubs/api/common/util/util";
import { DrizzleAsyncProvider } from "@sparcs-clubs/api/drizzle/drizzle.provider";
import {
  Meeting,
  MeetingAgenda,
  MeetingAnnouncement,
  MeetingAttendanceTimeT,
  MeetingMapping,
  MeetingVoteResult,
} from "@sparcs-clubs/api/drizzle/schema/meeting.schema";

@Injectable()
export class MeetingRepository {
  constructor(@Inject(DrizzleAsyncProvider) private db: MySql2Database) {}

  async entryMeeting(userId: number, meetingId: number) {
    const startTerm = new Date();
    const result = await this.db.insert(MeetingAttendanceTimeT).values({
      userId,
      meetingId,
      startTerm,
    });
    return result;
  }

  async exitMeeting(userId: number, meetingId: number) {
    const endTerm = new Date();
    const result = await this.db
      .update(MeetingAttendanceTimeT)
      .set({
        endTerm,
      })
      .where(
        and(
          eq(MeetingAttendanceTimeT.userId, userId),
          eq(MeetingAttendanceTimeT.meetingId, meetingId),
        ),
      );

    return result;
  }

  async vote(choiceId: number, userId: number, voteId: number) {
    const result = await this.db.insert(MeetingVoteResult).values({
      voteId,
      choiceId,
      userId,
    });

    return result;
  }

  async postExecutiveMeetingAnnouncement(contents: {
    meetingEnumId: number;
    announcementTitle: string;
    announcementContent: string;
    startDate: Date;
    endTerm?: Date;
    isRegular: boolean;
    location?: string;
    locationEn?: string;
  }): Promise<number | undefined> {
    // TODO: string인 필수 field validation
    const insertedAnnouncementId = await this.db.transaction(async tx => {
      const [announcementInsertResult] = await tx
        .insert(MeetingAnnouncement)
        .values({
          announcementTitle: contents.announcementTitle,
          announcementContent: contents.announcementContent,
        });

      if (announcementInsertResult.affectedRows !== 1) {
        logger.debug("[MeetingRepository] Failed to insert announcement");
        tx.rollback();
        return undefined;
      }

      const announcementId = announcementInsertResult.insertId;
      logger.debug(
        `[MeetingRepository] Inserted announcement: ${announcementId}`,
      );

      // meetingTag는 같이 묶이는 분과회의를 위한 것으로, 행 생성시 backend에서 임의의 값을 할당하여야합니다.
      // TODO : 이 부분의 태그를 어떻게 설정할 것인지에 대한 작업이 필요합니다.
      const meetingTag = "tag";

      const [meetingInsertResult] = await tx.insert(Meeting).values({
        announcementId,
        meetingEnumId: contents.meetingEnumId,
        startDate: contents.startDate,
        endTerm: contents.endTerm,
        isRegular: contents.isRegular,
        location: contents.location,
        locationEn: contents.locationEn,
        tag: meetingTag,
      });
      if (meetingInsertResult.affectedRows !== 1) {
        logger.debug("[MeetingRepository] Failed to insert meeting");
        tx.rollback();
        return undefined;
      }
      logger.debug(
        `[MeetingRepository] Inserted meeting: ${meetingInsertResult.insertId}`,
      );

      return announcementId;
    });
    return insertedAnnouncementId;
  }

  async selectMeetingAnnouncementById(announcementId: number) {
    const result = await this.db
      .select({
        announcementTitle: MeetingAnnouncement.announcementTitle,
        announcementContent: MeetingAnnouncement.announcementContent,
      })
      .from(MeetingAnnouncement)
      .where(
        and(
          eq(MeetingAnnouncement.id, announcementId),
          isNull(MeetingAnnouncement.deletedAt),
        ),
      )
      .execute();

    if (result.length !== 1) {
      logger.debug(
        `[MeetingRepository] Failed to select announcement: ${announcementId}`,
      );
      throw new HttpException("No such meeting", HttpStatus.BAD_REQUEST);
    }
    return result[0];
  }

  async selectMeetingById(announcementId: number) {
    const result = await this.db
      .select({
        meetingEnumId: Meeting.meetingEnumId,
        startDate: Meeting.startDate,
        endTerm: Meeting.endTerm,
        isRegular: Meeting.isRegular,
        location: Meeting.location,
        locationEn: Meeting.locationEn,
        tag: Meeting.tag,
      })
      .from(Meeting)
      .where(eq(Meeting.announcementId, announcementId))
      .execute();

    if (result.length !== 1) {
      logger.debug(
        `[MeetingRepository] Failed to select meeting: ${announcementId}`,
      );
      return null;
    }
    return result[0];
  }

  async updateExecutiveMeetingAnnouncement(
    param: { announcementId: number },
    body: {
      meetingEnumId?: number;
      announcementTitle?: string;
      announcementContent?: string;
      startDate?: Date;
      endTerm?: Date;
      isRegular?: boolean;
      location?: string;
      locationEn?: string;
      tag?: string;
    },
  ) {
    const isUpdateSucceed = await this.db.transaction(async tx => {
      const announcementUpdates: {
        announcementTitle?: string;
        announcementContent?: string;
      } = {};
      if (body.announcementTitle !== undefined) {
        announcementUpdates.announcementTitle = body.announcementTitle;
      }
      if (body.announcementContent !== undefined) {
        announcementUpdates.announcementContent = body.announcementContent;
      }

      if (Object.keys(announcementUpdates).length > 0) {
        const [announcementUpdateResult] = await tx
          .update(MeetingAnnouncement)
          .set(announcementUpdates)
          .where(eq(MeetingAnnouncement.id, param.announcementId));

        if (announcementUpdateResult.affectedRows !== 1) {
          logger.debug("[MeetingRepository] Failed to update announcement");
          tx.rollback();
          return false;
        }
        logger.debug(
          `[MeetingRepository] Updated announcement: ${param.announcementId}`,
        );
      }

      const meetingUpdates: {
        meetingEnumId?: number;
        startDate?: Date;
        endTerm?: Date;
        isRegular?: boolean;
        location?: string;
        locationEn?: string;
        tag?: string;
      } = {};
      if (body.meetingEnumId !== undefined) {
        meetingUpdates.meetingEnumId = body.meetingEnumId;
      }
      if (body.startDate !== undefined) {
        meetingUpdates.startDate = body.startDate;
      }
      if (body.endTerm !== undefined) {
        meetingUpdates.endTerm = body.endTerm;
      }
      if (body.isRegular !== undefined) {
        meetingUpdates.isRegular = body.isRegular;
      }
      if (body.location !== undefined) {
        meetingUpdates.location = body.location;
      }
      if (body.locationEn !== undefined) {
        meetingUpdates.locationEn = body.locationEn;
      }
      if (body.tag !== undefined) {
        meetingUpdates.tag = body.tag;
      }

      if (Object.keys(meetingUpdates).length > 0) {
        const [meetingUpdateResult] = await tx
          .update(Meeting)
          .set(meetingUpdates)
          .where(eq(Meeting.announcementId, param.announcementId));
        if (meetingUpdateResult.affectedRows !== 1) {
          logger.debug("[MeetingRepository] Failed to update meeting");
          tx.rollback();
          return false;
        }
        logger.debug(
          `[MeetingRepository] Updated meeting: ${param.announcementId}`,
        );
      }

      return true;
    });

    return isUpdateSucceed;
  }

  async deleteExecutiveMeetingAnnouncement(content: {
    announcementId: number;
  }) {
    const deletedAt = getKSTDate();
    const isDeleteSucceed = await this.db.transaction(async tx => {
      const [meetingDeleteResult] = await tx
        .update(Meeting)
        .set({ deletedAt })
        .where(eq(Meeting.announcementId, content.announcementId));

      if (meetingDeleteResult.affectedRows !== 1) {
        logger.debug("[MeetingRepository] Failed to delete meeting");
        tx.rollback();
        return false;
      }
      logger.debug(
        `[MeetingRepository] Deleted meeting: ${content.announcementId}`,
      );

      const [announcementDeleteResult] = await tx
        .update(MeetingAnnouncement)
        .set({ deletedAt })
        .where(eq(MeetingAnnouncement.id, content.announcementId));

      if (announcementDeleteResult.affectedRows !== 1) {
        logger.debug("[MeetingRepository] Failed to delete announcement");
        tx.rollback();
        return false;
      }
      logger.debug(
        `[MeetingRepository] Deleted announcement: ${content.announcementId}`,
      );

      return true;
    });

    return isDeleteSucceed;
  }

  async selectExecutiveMeetingNextDegree(query: { meetingEnumId: number }) {
    const thisYear = getKSTDate().getFullYear();
    const startDate = new Date(thisYear, 0, 1);
    const endTerm = new Date(thisYear + 1, 0, 1);

    const result = await this.db
      .select()
      .from(Meeting)
      .where(
        and(
          eq(Meeting.meetingEnumId, query.meetingEnumId),
          gte(Meeting.startDate, startDate),
          lt(Meeting.startDate, endTerm),
        ),
      );

    return result.length + 1;
  }

  async insertMeetingAgendaAndMapping(
    meetingId: number,
    meetingEnumId: number,
    description: string,
    title: string,
  ) {
    const isInsertAgendaAndMappingSuccess = await this.db.transaction(
      async tx => {
        const [insertAgendaResult] = await tx.insert(MeetingAgenda).values({
          MeetingAgendaEnum: meetingEnumId,
          description,
          title,
          isEditableSelf: true,
          isEditableDivisionPresident: true,
          isEditableRepresentative: true,
        });

        if (insertAgendaResult.affectedRows !== 1) {
          logger.debug("[MeetingRepository] Failed to insert meeting agenda");
          tx.rollback();
          return false;
        }

        const agendaId = insertAgendaResult.insertId;
        logger.debug(
          `[MeetingRepository] Inserted meeting agenda: ${agendaId}`,
        );

        const getMax = await tx
          .select({ value: max(MeetingMapping.meetingAgendaPosition) })
          .from(MeetingMapping)
          .where(and(eq(MeetingMapping.meetingId, meetingId)));

        const maxAgendaPosition = getMax[0]?.value ?? 0; // CHACHA: undefined라면 0으로 set. <TEST 필요>

        const [insertMappingResult] = await tx.insert(MeetingMapping).values({
          meetingId,
          meetingAgendaId: agendaId,
          meetingAgendaPosition: maxAgendaPosition + 1,
          meetingAgendaEntityType: 3, // no agenda entity mapped yet.
        });

        if (insertMappingResult.affectedRows !== 1) {
          logger.debug("[MeetingRepository] Failed to insert meeting agenda");
          tx.rollback();
          return false;
        }

        const meetingMappingId = insertMappingResult.insertId;
        logger.debug(
          `[MeetingRepository] Inserted meeting agenda mapping: ${meetingMappingId}`,
        );

        await tx
          .update(Meeting)
          .set({ statusEnumId: MeetingStatusEnum.Agenda })
          .where(eq(Meeting.id, meetingId));
        logger.debug(
          `[MeetingRepository] Updated meeting status, meetingId: ${meetingId}`, // CHACHA: meeting-agenda mapping이 생겼으므로 안건 공개 상태로 변경!
        );

        return true;
      },
    );

    return isInsertAgendaAndMappingSuccess;
  }

  async getMeetingAgendas(meetingId: number) {
    const rawAgendas = await this.db
      .select({
        agendaId: MeetingAgenda.id,
        agendaEnumId: MeetingAgenda.MeetingAgendaEnum,
        title: MeetingAgenda.title,
        description: MeetingAgenda.description,
      })
      .from(MeetingMapping)
      .innerJoin(
        MeetingAgenda,
        eq(MeetingMapping.meetingAgendaId, MeetingAgenda.id),
      )
      .where(eq(MeetingMapping.meetingId, meetingId));

    if (rawAgendas.length === 0) {
      logger.debug(
        `[MeetingRepository] No agendas found for meeting ID: ${meetingId}`,
      );
      return null;
    }

    const response = {
      agendas: rawAgendas.map(agenda => ({
        agendaId: agenda.agendaId,
        agendaEnumId: agenda.agendaEnumId,
        title: agenda.title,
        description: agenda.description,
      })),
    };

    return response;
  }

  async updateMeetingAgenda(
    agendaId: number,
    agendaEnumId: number,
    description: string,
    title: string,
  ) {
    const updateAgendaNotDeletedResult = await this.db.transaction(async tx => {
      const checkDeleted = await tx
        .select({ isDeleted: MeetingAgenda.deletedAt })
        .from(MeetingAgenda)
        .where(eq(MeetingAgenda.id, agendaId));

      if (checkDeleted.length === 0) {
        logger.debug("[MeetingRepository] No such agenda exists."); // CHACHA: AgendatId가 유효한지
        return false;
      }

      if (checkDeleted[0]?.isDeleted) {
        logger.debug("[MeetingRepository] This agenda is deleted."); // CHACHA: Update 시에 deletedAt을 검사
        return false;
      }

      const [result] = await tx
        .update(MeetingAgenda)
        .set({
          MeetingAgendaEnum: agendaEnumId,
          title,
          description,
          updatedAt: sql<Date>`NOW()`,
        })
        .where(eq(MeetingAgenda.id, agendaId));

      if (result.affectedRows !== 1) {
        logger.debug("[MeetingRepository] Failed to update meeting agenda.");
        return false;
      }

      return result;
    });

    logger.debug(`[MeetingRepository] Updated meeting agenda: ${agendaId}`);
    return updateAgendaNotDeletedResult;
  }

  async deleteMeetingAgendaMapping(meetingId: number, agendaId: number) {
    const meetingAgendaMappingDeleteResult = await this.db.transaction(
      async tx => {
        const [deleteResult] = await tx // CHACHA: soft delete로 수정!
          .update(MeetingMapping)
          .set({ deletedAt: sql<Date>`NOW()` })
          .where(
            and(
              eq(MeetingMapping.meetingId, meetingId),
              eq(MeetingMapping.meetingAgendaId, agendaId),
            ),
          );

        if (deleteResult.affectedRows !== 1) {
          logger.debug(
            "[MeetingRepository] Failed to soft delete meeting agenda mapping.",
          );
          return false;
        }

        logger.debug(
          `[MeetingRepository] Soft deleted meeting agenda mapping: ${meetingId}, ${agendaId}`,
        );

        const getEveryMappingByMeetingId = await tx
          .select({ count: count() }) // CHACHA: 만약 모든 Meeting과 Agenda mapping이 deleted -> 그 Meeting은 공고 게시 상태로!
          .from(MeetingMapping)
          .where(and(eq(MeetingMapping.meetingId, meetingId)));

        const getEveryDeletedMappingByMeetingId = await tx
          .select({ count: count() })
          .from(MeetingMapping)
          .where(
            and(
              eq(MeetingMapping.meetingId, meetingId),
              not(eq(MeetingMapping.deletedAt, null)),
            ),
          );

        if (
          getEveryMappingByMeetingId[0]?.count ===
          getEveryDeletedMappingByMeetingId[0]?.count
        ) {
          // CHACHA: 만약 모든 Meeting과 Agenda mapping이 deleted -> 그 Meeting은 공고 게시 상태로!
          await tx
            .update(Meeting)
            .set({ statusEnumId: MeetingStatusEnum.Announcement })
            .where(eq(Meeting.id, meetingId));
          logger.debug(
            `[MeetingRepository] Updated meeting status, meetingId: ${meetingId}`,
          );
        }

        return deleteResult;
      },
    );

    return meetingAgendaMappingDeleteResult;
  }

  async updateMeetingAgendasOrder(meetingId: number, agendaIdList: number[]) {
    if (agendaIdList.length === 0) {
      logger.debug(
        `[MeetingRepository] No agenda IDs provided for meeting ID: ${meetingId}`,
      );
      return null; // No need to update if the list is empty
    }

    await this.db.transaction(async trx => {
      const updatePromises = agendaIdList.map((agendaId, index) =>
        // Create a promise for each agenda update
        trx
          .update(MeetingMapping)
          .set({ meetingAgendaPosition: index }) // Set the new position based on the index
          .where(
            and(
              eq(MeetingMapping.meetingAgendaId, agendaId),
              eq(MeetingMapping.meetingId, meetingId),
              isNull(MeetingMapping.deletedAt), // Filter out soft-deleted records
            ),
          )
          .then(result => {
            // Log a warning if no row was updated
            if (result[0].affectedRows === 0) {
              logger.warn(
                `[MeetingRepository] No MeetingMapping found for meeting ID: ${meetingId} and agenda ID: ${agendaId}`,
              );
            }
          }),
      );

      // Wait for all updates to complete concurrently
      await Promise.all(updatePromises);
    });

    logger.info(
      `[MeetingRepository] Successfully updated agenda positions for meeting ID: ${meetingId}`,
    );
    return { success: true };
  }

  async addMeetingAgendaMapping(meetingId: number, agendaId: number) {
    // Check if a mapping already exists to avoid duplicates
    const existingMapping = await this.db
      .select()
      .from(MeetingMapping)
      .where(
        and(
          eq(MeetingMapping.meetingId, meetingId),
          eq(MeetingMapping.meetingAgendaId, agendaId),
        ),
      )
      .execute();

    if (existingMapping.length > 0) {
      logger.debug(
        `[MeetingRepository] Mapping already exists for meetingId: ${meetingId} and agendaId: ${agendaId}`,
      );
      return { success: false, message: "Mapping already exists" };
    }

    // Get the current maximum meetingAgendaPosition for the given meetingId
    const [maxPositionResult] = await this.db
      .select({
        maxPosition: sql<number>`MAX(${MeetingMapping.meetingAgendaPosition})`,
      })
      .from(MeetingMapping)
      .where(eq(MeetingMapping.meetingId, meetingId))
      .execute();

    const newPosition = (maxPositionResult?.maxPosition || 0) + 1;

    // Insert the new mapping into the MeetingMapping table
    const result = await this.db
      .insert(MeetingMapping)
      .values({
        meetingId,
        meetingAgendaId: agendaId,
        meetingAgendaPosition: newPosition, // Set position to the next available value
        meetingAgendaEntityType: 1, // Entity type is fixed to 1
      })
      .execute();

    // Check if insertion was successful
    if (result[0].affectedRows === 1) {
      logger.info(
        `[MeetingRepository] Successfully added mapping for meetingId: ${meetingId} and agendaId: ${agendaId} with position: ${newPosition}`,
      );
      return { success: true };
    }
    logger.error(
      `[MeetingRepository] Failed to add mapping for meetingId: ${meetingId} and agendaId: ${agendaId}`,
    );
    return { success: false, message: "Failed to add mapping" };
  }

  async getMeetingListByMeetingType(
    meetingEnumId: MeetingEnum,
    pageOffset: number,
    itemCount: number,
  ): Promise<ApiMee012ResponseOk> {
    const conditions = [
      isNull(MeetingAnnouncement.deletedAt),
      ...(meetingEnumId != null
        ? [eq(Meeting.meetingEnumId, meetingEnumId)]
        : []),
    ];

    const numberOfMeetings = (
      await this.db
        .select({ count: count() })
        .from(Meeting)
        .leftJoin(
          MeetingAnnouncement,
          eq(Meeting.announcementId, MeetingAnnouncement.id),
        )
        .where(and(...conditions))
    ).at(0).count;

    const rows = await this.db
      .select({
        id: Meeting.id,
        meetingEnumId: Meeting.meetingEnumId,
        meetingTitle: MeetingAnnouncement.announcementTitle,
        meetingDate: Meeting.startDate,
        isRegular: Meeting.isRegular,
        tag: Meeting.tag,
        meetingStatus: Meeting.statusEnumId,
      })
      .from(Meeting)
      .leftJoin(
        MeetingAnnouncement,
        eq(Meeting.announcementId, MeetingAnnouncement.id),
      )
      .where(and(...conditions))
      .offset((pageOffset - 1) * itemCount)
      .limit(itemCount);

    // TODO(ym). 분과회의일 경우 title 뒤에 분과이름 추가하여 보내주기(혹은 분과이름 정보를 보내주기)
    // (Meeting에 컬럼 추가할거 같은데 나중에 분과회의 tag 관련 작업할 때 한 번에 하기!)

    const result = {
      total: numberOfMeetings,
      items: rows,
      offset: pageOffset,
    };
    return result;
  }
}
