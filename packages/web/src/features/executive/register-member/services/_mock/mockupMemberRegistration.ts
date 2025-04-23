import { ApiReg019ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg019";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

const divisionName = [
  "생활문화",
  "연행예술",
  "전시창작",
  "밴드음악",
  "보컬음악",
  "연주음악",
  "사회",
  "종교",
  "구기체육",
  "생활체육",
  "이공학술",
  "인문학술",
  "식생활",
  "대중문화",
];

const clubType = [ClubTypeEnum.Provisional, ClubTypeEnum.Regular];

const permanentType = [false, true, false];

const items = Array.from({ length: 120 }, (_, index) => ({
  clubId: index + 1,
  clubTypeEnumId: (index % clubType.length) + 1,
  isPermanent: permanentType[index % permanentType.length],
  division: {
    id: (index % divisionName.length) + 1,
    name: divisionName[index % divisionName.length],
  }, // 랜덤 상태 선택
  clubName: "술박스",
  totalRegistrations: 200,
  regularMemberRegistrations: 100,
  totalApprovals: 120,
  regularMemberApprovals: 90,
}));

const mockupRegistrationMember: ApiReg019ResponseOk = {
  items,
  total: items.length,
  offset: 1,
};

export default mockupRegistrationMember;
