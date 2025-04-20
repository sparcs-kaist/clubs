import {
  boolean,
  datetime,
  foreignKey,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { Club } from "./club.schema";
import { Division } from "./division.schema";
import { User } from "./user.schema";

export const MeetingRoleEnum = mysqlTable("meeting_role_enum", {
  id: int("id").primaryKey(),
  name: varchar("name", { length: 30 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
});

export const MeetingAnnouncement = mysqlTable("meeting_announcement", {
  id: int("id").autoincrement().primaryKey(),
  announcementTitle: varchar("title", { length: 255 }).notNull(),
  announcementContent: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
});

export const Meeting = mysqlTable(
  "meeting",
  {
    id: int("id").autoincrement().primaryKey(),
    announcementId: int("meeting_announcement_id"),
    meetingEnumId: int("meeting_type_enum").notNull(),
    isRegular: boolean("is_regular_meeting").notNull(),
    location: varchar("location_kr", { length: 255 }),
    locationEn: varchar("location_en", { length: 255 }),
    startDate: datetime("start_datetime").notNull(),
    endTerm: datetime("end_datetime"),
    tag: varchar("meeting_group_tag", { length: 255 }).notNull(),
    statusEnumId: int("meeting_status_enum").notNull().default(1), // CHACHA : NEW!
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    meetingMeetingAnnouncementIdFk: foreignKey({
      name: "meeting_announcement_id_fk",
      columns: [table.announcementId],
      foreignColumns: [MeetingAnnouncement.id],
    }),
  }),
);

export const MeetingAgenda = mysqlTable("meeting_agenda", {
  id: int("id").autoincrement().primaryKey(),
  MeetingAgendaEnum: int("enum").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  isEditableDivisionPresident: boolean(
    "is_editable_divisionPresident",
  ).notNull(),
  isEditableRepresentative: boolean("is_editable_representative").notNull(),
  isEditableSelf: boolean("is_editable_self").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
});

export const MeetingAgendaContent = mysqlTable("meeting_agenda_content", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
});

export const MeetingAttendanceDay = mysqlTable(
  "meeting_attendance_day",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meeting_id").notNull(),
    meetingRoleEnum: int("meeting_role_enum").notNull(),
    whichClubId: int("which_club_id").references(() => Club.id),
    whichDivisionId: int("which_division_id").references(() => Division.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    meetingMeetingAttendanceDayIdFk: foreignKey({
      name: "meeting_meeting_attendance_day_id_fk",
      columns: [table.meetingId],
      foreignColumns: [Meeting.id],
    }),
    meetingAttendanceDayRoleEnumFk: foreignKey({
      name: "meeting_attendance_day_role_enum_fk",
      columns: [table.meetingRoleEnum],
      foreignColumns: [MeetingRoleEnum.id],
    }),
  }),
);

export const MeetingAttendanceTimeT = mysqlTable(
  "meeting_attendance_time_t",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meeting_id")
      .references(() => Meeting.id)
      .notNull(),
    userId: int("user_id")
      .references(() => User.id)
      .notNull(),
    startTerm: datetime("start_term").notNull(),
    endTerm: datetime("end_term"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    meetingMeetingAttendanceTimeTIdFk: foreignKey({
      name: "meeting_meeting_attendance_time_t_id_fk",
      columns: [table.meetingId],
      foreignColumns: [Meeting.id],
    }),
    userMeetingAttendanceTimeTIdFk: foreignKey({
      name: "user_meeting_attendance_time_t_id_fk",
      columns: [table.userId],
      foreignColumns: [User.id],
    }),
  }),
);

export const MeetingAgendaVote = mysqlTable("meeting_agenda_vote", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  deletedAt: timestamp("deleted_at"),
});

export const MeetingVoteChoice = mysqlTable(
  "meeting_vote_choice",
  {
    id: int("id").autoincrement().primaryKey(),
    voteId: int("vote_id").notNull(),
    choice: varchar("choice", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    meetingAgendaVoteChoiceIdFk: foreignKey({
      name: "meeting_agenda_vote_choice_id_fk",
      columns: [table.voteId],
      foreignColumns: [MeetingAgendaVote.id],
    }),
  }),
);

export const MeetingVoteResult = mysqlTable(
  "meeting_vote_result",
  {
    id: int("id").autoincrement().primaryKey(),
    voteId: int("vote_id").notNull(),
    userId: int("user_id").notNull(),
    choiceId: int("choice_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
    deletedAt: timestamp("deleted_at"),
  },
  table => ({
    meetingAgendaVoteResultIdFk: foreignKey({
      name: "meeting_agenda_vote_result_id_fk",
      columns: [table.voteId],
      foreignColumns: [MeetingAgendaVote.id],
    }),
    userMeetingVoteResultIdFk: foreignKey({
      name: "user_meeting_vote_result_id_fk",
      columns: [table.userId],
      foreignColumns: [User.id],
    }),
    meetingVoteChoiceResultIdFk: foreignKey({
      name: "meeting_vote_choice_result_id_fk",
      columns: [table.choiceId],
      foreignColumns: [MeetingVoteChoice.id],
    }),
  }),
);

export const MeetingMapping = mysqlTable(
  "meeting_mapping",
  {
    id: int("id").autoincrement().primaryKey(),
    meetingId: int("meeting_id").notNull(),
    meetingAgendaId: int("meeting_agenda_id").notNull(),
    meetingAgendaPosition: int("meeting_agenda_position").notNull(),
    meetingAgendaEntityType: int("meeting_agenda_entity_type").notNull(),
    meetingAgendaContentId: int("meeting_agenda_content_id"),
    meetingAgendaVoteId: int("meeting_agenda_vote_id"),
    meetingAgendaEntityPosition: int("meeting_agenda_entity_position"),
    createdAt: timestamp("created_at").defaultNow(), // CHACHA : NEW!
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(), // CHACHA : NEW!
    deletedAt: timestamp("deleted_at"), // CHACHA : NEW!
  },
  table => ({
    meetingMeetingMappingIdFk: foreignKey({
      name: "meeting_meeting_mapping_id_fk",
      columns: [table.meetingId],
      foreignColumns: [Meeting.id],
    }),
    meetingAgendaMeetingMappingIdFk: foreignKey({
      name: "meeting_agenda_meeting_mapping_id_fk",
      columns: [table.meetingAgendaId],
      foreignColumns: [MeetingAgenda.id],
    }),
    meetingAgendaContentMeetingMappingIdFk: foreignKey({
      name: "meeting_agenda_content_meeting_mapping_id_fk",
      columns: [table.meetingAgendaContentId],
      foreignColumns: [MeetingAgendaContent.id],
    }),
    meetingAgendaVoteMeetingMappingIdFk: foreignKey({
      name: "meeting_agenda_vote_meeting_mapping_id_fk",
      columns: [table.meetingAgendaVoteId],
      foreignColumns: [MeetingAgendaVote.id],
    }),
  }),
);
