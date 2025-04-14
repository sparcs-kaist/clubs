import { MeetingEnum } from "@clubs/interface/common/enum/meeting.enum";

import { getFullSemester } from "@sparcs-clubs/web/utils/getSemester";

export type TemplateType = {
  title: string;
  content: string;
};

export const meetingType = "[[MEETING_TYPE]]]";
export const isRegular = "[[[IS_REGULAR]]]";
export const dateTime = "[[[DATE]]] [[[TIME]]]";
export const startDate = "[[[START_DATE]]]";
export const endTerm = "[[[END_DATE]]]";
export const location = "[[[LOCATION_KR]]]";
export const locationEn = "[[[LOCATION_EN]]]";

export class MeetingTemplate {
  static getContent(type: MeetingEnum, count?: number) {
    const now = new Date();

    if (
      type === MeetingEnum.expansiveOperativeCommittee ||
      type === MeetingEnum.operativeCommittee
    ) {
      return `안녕하세요, 동아리연합회 부회장입니다.
        
본회 회칙 제${type === MeetingEnum.expansiveOperativeCommittee ? 35 : 40}조에 따라, 제${count ?? "X"}차 ${meetingType} (${now.getMonth() + 1}월, ${isRegular})를 아래와 같이 진행합니다.

일시 : ${dateTime}
장소 : ${location}

감사합니다.`;
    }

    if (type === MeetingEnum.clubRepresentativesCouncilMeeting) {
      return `(English Notice on the bottom)

안녕하세요, 학부 동아리연합회 부회장입니다.

다음과 같이 전동대회 일시와 장소를 공고합니다.

일시 : ${dateTime}
장소 : ${location}

- 출결 관련 유의사항 (본회 회칙 제17조 참고) -
이번 회의의 재적 인원은 ${getFullSemester(now)} 등록을 기준으로 합니다.
출석은 1인 당 1개 직에 대해서만 인정하며, 동아리 대표자 본인의 출석이 불가한 경우 대의원(의결권 O) 혹은 대리인(의결권 X)도 출석이 인정됩니다.

감사합니다.

---

Hello, this is the vice-president of KAIST Undergraduate Students Clubs Union.

The date and location of the 1st Council of the Club Representatives in 2024 is announced as follows:

Date & Time : ${dateTime}
Location : ${locationEn}

- Precautions Related to Attendance -
The students who is obligated to attend in this legislative is based on the registration of ${getFullSemester(now, true)} semester.
If the club representative is unable to attend, another delegate (with voting right) or deputy (without voting right) can also be admitted.

Thank you.`;
    }
    return "";
  }

  static defaultTemplate(type: MeetingEnum, count?: number): TemplateType {
    const now = new Date();

    return {
      title: `${now.getFullYear()}년 제${count ?? "X"}차 ${meetingType} (${now.getMonth() + 1}월, ${isRegular})`,
      content: this.getContent(type, count),
    };
  }

  static divisionMeetingTemplate(): TemplateType {
    const now = new Date();

    return {
      title: `${now.getMonth()}월 ${meetingType} 기간 공고`,
      content: `안녕하세요, 부회장입니다.

${now.getMonth()}월 분과회의 기간을 다음과 같이 공고합니다.
${startDate} ~ ${endTerm}

감사합니다.`,
    };
  }
}
