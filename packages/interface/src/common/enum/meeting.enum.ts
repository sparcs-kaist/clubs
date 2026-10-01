export const MeetingEnum = {
  clubRepresentativesCouncilMeeting: 1, // 전동대회
  expansiveOperativeCommittee: 2, // 확대운영위원회
  operativeCommittee: 3, // 운영위원회
  divisionMeeting: 4, // 분과회의
} as const;

export type MeetingEnum = (typeof MeetingEnum)[keyof typeof MeetingEnum];

export const MeetingStatusEnum = {
  Announcement: 1, // 공고 게시
  Agenda: 2, // 안건 공개
  Complete: 3, // 회의 종료
} as const;

export type MeetingStatusEnum =
  (typeof MeetingStatusEnum)[keyof typeof MeetingStatusEnum];

export const MeetingAgendaEntityTypeEnum = {
  Content: 1, // Mapping Table에서 Content가 mapping된 경우
  Vote: 2, // Mapping Table에서 Vote mapping된 경우
  AgendaOnly: 3, // Mapping Table에서 Agenda까지만 mapping된 경우
} as const;

export type MeetingAgendaEntityTypeEnum =
  (typeof MeetingAgendaEntityTypeEnum)[keyof typeof MeetingAgendaEntityTypeEnum];
