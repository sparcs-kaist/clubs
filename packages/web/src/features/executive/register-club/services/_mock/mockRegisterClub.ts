import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

export interface RegisterClubList {
  items: RegisterClub[];
  total: number;
  offset: number;
}

export interface RegisterClub {
  id: number;
  registrationStatusEnumId: RegistrationStatusEnum;
  registrationTypeEnumId: RegistrationTypeEnum;
  divisionId: number;
  clubNameKr?: string;
  newClubNameKr: string;
  clubNameEn?: string;
  newClubNameEn: string;
  representativeName: string;
  activityFieldKr: string;
  activityFieldEn: string;
  professorName?: string;
}

const items: Array<RegisterClub> = [
  {
    id: 1,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 1,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 2,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 2,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 3,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 3,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 4,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 4,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 5,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 5,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 6,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 6,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 7,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 7,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 8,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 8,
    clubNameKr: "술팍스",
    clubNameEn: "술팍스",
    newClubNameEn: "술팍스",
    newClubNameKr: "술팍스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 9,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 9,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 10,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 10,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "이지윤",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 11,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 11,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 12,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 12,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 13,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 12,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 14,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 13,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 15,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 14,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 16,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 1,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 17,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 15,
    clubNameKr: "술팍스",
    clubNameEn: "술팍스",
    newClubNameEn: "술팍스",
    newClubNameKr: "술팍스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 18,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 12,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 19,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 12,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 20,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 12,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 21,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 12,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
  {
    id: 22,
    registrationStatusEnumId: RegistrationStatusEnum.Pending,
    registrationTypeEnumId: RegistrationTypeEnum.Renewal,
    divisionId: 12,
    clubNameKr: "술박스",
    clubNameEn: "술박스",
    newClubNameEn: "술박스",
    newClubNameKr: "술박스",
    representativeName: "권진현",
    activityFieldKr: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    activityFieldEn: "개발개발한 어떤 활동~sjfslkjfksldjklf",
    professorName: "박지호",
  },
];

export const mockRegisterClub: RegisterClubList = {
  items,
  total: items.length,
  offset: 10,
};
