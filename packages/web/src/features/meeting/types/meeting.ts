import {
  MeetingEnum,
  MeetingStatusEnum,
} from "@clubs/interface/common/enum/meeting.enum";

export interface MeetingAnnouncementModel {
  meetingEnumId: MeetingEnum;
  announcementTitle: string;
  announcementContent: string;
  startDate: Date;
  endTerm?: Date;
  isRegular: string;
  location?: string;
  locationEn?: string;
}

export const getMeetingEnumFromValue = (value: string | null) => {
  switch (value) {
    case "1":
      return MeetingEnum.clubRepresentativesCouncilMeeting;
    case "2":
      return MeetingEnum.expansiveOperativeCommittee;
    case "3":
      return MeetingEnum.operativeCommittee;
    case "4":
      return MeetingEnum.divisionMeeting;
    default:
      return undefined;
  }
};

export const meetingEnumToText = (meetingEnum: string) => {
  switch (meetingEnum) {
    case MeetingEnum.clubRepresentativesCouncilMeeting.toString():
      return "전체동아리대표자회의";
    case MeetingEnum.expansiveOperativeCommittee.toString():
      return "확대운영위원회";
    case MeetingEnum.operativeCommittee.toString():
      return "운영위원회";
    default:
      return "분과회의";
  }
};

export interface MeetingNoticeItemType {
  id: number;
  meetingEnumId: MeetingEnum;
  isRegular: boolean;
  meetingTitle: string;
  meetingDate: Date;
  meetingStatus: MeetingStatusEnum;
}
