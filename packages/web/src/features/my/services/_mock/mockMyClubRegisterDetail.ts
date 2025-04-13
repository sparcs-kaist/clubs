import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";
import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";
import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";

import { MyClubRegistrationDetail } from "@sparcs-clubs/web/features/my/types/myClubRegistration";

const mockMyClubRegisterList = {
  registrations: [
    {
      id: 1,
      registrationTypeEnum: RegistrationTypeEnum.Promotional,
      registrationStatusEnum: RegistrationStatusEnum.Pending,
      krName: "스팍스",
      enName: "SPACRS",
    },
  ],
};

// validation 검증을 해야 하기에 변경 시 사용되는 곳 api 확인하면서 변경
const mockMyClubRegisterDetail: MyClubRegistrationDetail = {
  id: 1,
  registrationStatusEnumId: RegistrationStatusEnum.Pending,
  registrationTypeEnumId: RegistrationTypeEnum.Renewal,
  clubNameKr: "스팍스",
  clubNameEn: "sparcs",
  clubId: 1,
  representative: {
    studentNumber: 1,
    name: "넙죽이",
  },
  phoneNumber: "010-1234-1234",
  foundedAt: new Date(),
  divisionId: 1,
  activityFieldKr: "개발",
  activityFieldEn: "Gaebal",
  professor: {
    name: "이교수",
    professorEnumId: ProfessorEnum.Full,
    email: "gyosu@kaist.ac.kr",
  },
  divisionConsistency: "어쩌구저쩌구",
  foundationPurpose: "어쩌구저쩌구",
  activityPlan: "어쩌구저쩌구",
  updatedAt: new Date(),
  isProfessorSigned: false,
  comments: [{ content: "내용", createdAt: new Date() }],
};

const mockMyClubRegisterAcf = {
  activities: [
    {
      name: "개발개발한 어떠한 활동",
      activityTypeEnumId: ActivityTypeEnum.matchedInternalActivity,
      duration: {
        startTerm: new Date(`2024-03-11T12:00:00Z`),
        endTerm: new Date(`2024-03-18T12:00:00Z`),
      },
    },
    {
      name: "개발개발한 어떠한 활동",
      activityTypeEnumId: ActivityTypeEnum.matchedExternalActivity,
      duration: {
        startTerm: new Date(`2024-03-11T12:00:00Z`),
        endTerm: new Date(`2024-03-18T12:00:00Z`),
      },
    },
    {
      name: "개발개발한 어떠한 활동",
      activityTypeEnumId: ActivityTypeEnum.notMatchedActivity,
      duration: {
        startTerm: new Date(`2024-03-11T12:00:00Z`),
        endTerm: new Date(`2024-03-18T12:00:00Z`),
      },
    },
  ],
};

export {
  mockMyClubRegisterAcf,
  mockMyClubRegisterDetail,
  mockMyClubRegisterList,
};
