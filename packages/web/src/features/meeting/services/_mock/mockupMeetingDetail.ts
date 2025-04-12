import { ApiMee002ResponseOk } from "@clubs/interface/api/meeting/apiMee002";
import { MeetingEnum } from "@clubs/interface/common/enum/meeting.enum";

import { MeetingTemplate } from "@sparcs-clubs/web/features/meeting/constants/meetingTemplate";

// meetingType 변경하여 각 케이스에 대한 mock 데이터 확인 가능
const meetingType = MeetingEnum.divisionMeeting;
const mockupMeetingTemplate =
  meetingType === MeetingEnum.divisionMeeting
    ? MeetingTemplate.divisionMeetingTemplate()
    : MeetingTemplate.defaultTemplate(meetingType, 100);

export const mockupMeetingDetail: ApiMee002ResponseOk = {
  announcementTitle: `${mockupMeetingTemplate.title} 수정수정수정함`,
  announcementContent: `${mockupMeetingTemplate.content} 수정수정수정함`,
  isRegular: false,
  meetingEnumId: meetingType,
  startDate: new Date(),
  endTerm: new Date(),
  location: "장소",
  locationEn: "location",
  tag: "tag",
};
