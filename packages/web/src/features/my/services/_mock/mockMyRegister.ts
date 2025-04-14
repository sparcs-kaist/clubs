import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import {
  RegistrationApplicationStudentStatusEnum,
  RegistrationDeadlineEnum,
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

const mockClubRegister = {
  registrations: [
    {
      registrationStatusEnumId: RegistrationStatusEnum.Pending,
      registrationTypeEnumId: RegistrationTypeEnum.NewProvisional,
      divisionName: "생활문화",
      clubNameKr: "술박스",
      activityFieldKr: "개발개발한 어떤 활동",
      professorName: "박지호",
      clubId: 1,
      id: 1,
      activityFieldEn: "Some activity that is developed",
    },
  ],
};

const mockProfClubRegister = {
  items: [
    {
      id: 1,
      clubId: 23,
      registrationStatusEnumId: RegistrationStatusEnum.Pending,
      division: { id: 1, name: "생활문화" },
      clubName: "술박스",
      student: {
        id: 1,
        studentNumber: 20200000,
        name: "이지윤",
        phoneNumber: "000-0000-0000",
        email: "xxxxx@kaist.ac.kr",
      },
      professorSignedAt: new Date(),
    },
  ],
};
const mockMemberRegister = {
  applies: [
    {
      id: 1,
      clubId: 1,
      clubNameKr: "술박스",
      type: ClubTypeEnum.Regular,
      isPermanent: false,
      divisionName: "생활문화",
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
    },
    {
      id: 2,
      clubId: 1,
      clubNameKr: "술박스",
      type: ClubTypeEnum.Regular,
      isPermanent: true,
      divisionName: "밴드음악",
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
    },
    {
      id: 3,
      clubId: 1,
      clubNameKr: "술박스",
      type: ClubTypeEnum.Provisional,
      isPermanent: false,
      divisionName: "사회",
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
    },
    {
      id: 4,
      clubId: 1,
      clubNameKr: "술박스",
      type: ClubTypeEnum.Provisional,
      isPermanent: false,
      divisionName: "보컬음악",
      applyStatusEnumId: RegistrationApplicationStudentStatusEnum.Pending,
    },
  ],
};
const mockRegisterPeriod = [
  RegistrationDeadlineEnum.ClubRegistrationApplication,
  RegistrationDeadlineEnum.StudentRegistrationApplication,
];

export {
  mockClubRegister,
  mockProfClubRegister,
  mockMemberRegister,
  mockRegisterPeriod,
};
