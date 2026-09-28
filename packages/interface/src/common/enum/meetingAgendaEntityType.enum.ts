/**
 * @description
 * Agenda에 연결될 수 있는 Entity 분류를 위한 enum
 *  Content: Mapping하는 요소가 회의록 등의 글인 경우
 *  Vote: Mapping하는 요소가 회의에서 진행된 투표인 경우
 *  Agenda: 그냥 Agenda까지만 나타내기 위한 Mapping인 경우
 */

export const MeetingAgendaEntityType = {
  Content: 1,
  Vote: 2,
  Agenda: 3,
} as const;

export type MeetingAgendaEntityType =
  (typeof MeetingAgendaEntityType)[keyof typeof MeetingAgendaEntityType];
