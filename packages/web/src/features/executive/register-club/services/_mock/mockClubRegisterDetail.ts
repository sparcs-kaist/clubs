// import { ApiReg015ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg015";
import { RegistrationTypeEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import { ProgressCheckSectionStatusEnum } from "@sparcs-clubs/web/common/components/ProgressStatus/_atomic/progressCheckStationStatus";

export const mockClubRegisterDetail = {
  statusAndDate: [
    {
      status: ProgressCheckSectionStatusEnum.Approved,
      date: undefined,
    },
    {
      status: ProgressCheckSectionStatusEnum.Canceled,
      date: new Date(2024, 3, 11, 21, 0),
    },
  ],
  registerClubType: RegistrationTypeEnum.Promotional,
  clubName: "스팍스",
  representativeName: "이지윤",
  representativePhoneNumber: "010-XXXX-XXXX",
  estYear: 2020,
  divisionName: "생활체육",
  fieldKR: "개발",
  fieldEN: "gaebal",
  professorName: "이교수",
  professorPosition: "정교수",
  professorEmail: "gyosu@kaist.ac.kr",
  clubDetail: {
    "분과 정합성": "어쩌고 저쩌고",
    "설립 목적": "어쩌고 저쩌고",
    "주요 활동 계획": "어쩌고 저쩌고",
  },
  attachmentList: {},
  isProfessorSigned: true,
  activityReports: true,
};
