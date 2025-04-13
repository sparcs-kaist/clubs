import type { ApiClb002ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb002";

const mockupData: ApiClb002ResponseOK = {
  id: 1,
  nameKr: "궁극의 맛",
  nameEn: "test",
  type: 1,
  isPermanent: false,
  characteristic: "요리",
  representative: "장주원",
  advisor: "",
  totalMemberCnt: 1,
  division: {
    id: 1,
    name: "생활문화",
  },
  foundingYear: 2015,
  room: "학부학생회관별관(N12) 3101호",
  description:
    "'궁극의 맛'은 카이스트 유일 요리친목동아리 궁극의 맛입니다! 자세한 사항은 인스타그램 @the_ult_taste 를 참고해주세요!",
};

export default mockupData;
