import { MeetingEnum } from "@clubs/interface/common/enum/meeting.enum";

export const MEETING_LIST_PAGINATION_LIMIT = 10;
export const MEETING_PATH = (meetingEnumId?: MeetingEnum) =>
  `/meeting?type=${meetingEnumId}`;
