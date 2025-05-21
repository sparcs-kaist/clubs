import {
  MeetingEnum,
  MeetingStatusEnum,
} from "@clubs/interface/common/enum/meeting.enum";

import { MeetingTemplate } from "@sparcs-clubs/web/features/meeting/constants/meetingTemplate";
import { MeetingNoticeItemType } from "@sparcs-clubs/web/features/meeting/types/meeting";

export interface MeetingList {
  items: MeetingNoticeItemType[];
  total: number;
  offset: number;
}

// 분과회의를 제외한 나머지 meeting type의 공고 템플릿 불러오기
const mockupMeetingTitle = (meetingType: MeetingEnum) =>
  `${MeetingTemplate.defaultTemplate(meetingType, 100).title} 수정수정함`;

const items: Array<MeetingNoticeItemType> = [
  {
    id: 1,
    meetingEnumId: MeetingEnum.clubRepresentativesCouncilMeeting,
    meetingTitle: mockupMeetingTitle(
      MeetingEnum.clubRepresentativesCouncilMeeting,
    ),
    meetingDate: new Date(),
    isRegular: true,
    meetingStatus: MeetingStatusEnum.Announcement,
  },
  {
    id: 2,
    meetingEnumId: MeetingEnum.operativeCommittee,
    meetingTitle: mockupMeetingTitle(MeetingEnum.operativeCommittee),
    meetingDate: new Date(),
    isRegular: true,
    meetingStatus: MeetingStatusEnum.Announcement,
  },
  {
    id: 3,
    meetingEnumId: MeetingEnum.expansiveOperativeCommittee,
    meetingTitle: mockupMeetingTitle(MeetingEnum.expansiveOperativeCommittee),
    meetingDate: new Date(),
    isRegular: true,
    meetingStatus: MeetingStatusEnum.Agenda,
  },
  {
    id: 4,
    meetingEnumId: MeetingEnum.divisionMeeting,
    meetingTitle: `${MeetingTemplate.divisionMeetingTemplate().title} (생활음악분과)`,
    meetingDate: new Date(),
    isRegular: true,
    meetingStatus: MeetingStatusEnum.Complete,
  },
];

export const mockupMeetings = (meetingEnumId?: MeetingEnum) => {
  const filteredItems =
    meetingEnumId != null
      ? items.filter(item => item.meetingEnumId === meetingEnumId)
      : items;

  return {
    items: filteredItems,
    total: filteredItems.length,
    offset: 10,
  };
};
