import { ClubTypeEnum } from "@sparcs-clubs/interface/common/enum/club.enum";

import type { TagColor } from "@sparcs-clubs/web/common/components/Tag";

const getTagColorFromClubType = (
  clubType: ClubTypeEnum,
  isPermanent: boolean,
) => {
  let color: TagColor;

  switch (clubType) {
    case ClubTypeEnum.Regular:
      color = "BLUE";
      break;
    default:
      color = "ORANGE";
      break;
  }
  if (isPermanent) color = "GREEN";

  return color;
};

const getTagContentFromClubType = (
  clubType: ClubTypeEnum,
  isPermanent: boolean,
) => {
  let content: string;

  switch (clubType) {
    case ClubTypeEnum.Regular:
      content = "정동아리";
      break;
    default:
      content = "가동아리";
      break;
  }
  if (isPermanent) content = "상임동아리";

  return content;
};

const getTagColorFromDivision = (divisionName: string): TagColor => {
  // TODO : getTagDetail 사용
  switch (divisionName) {
    case "생활문화":
    case "사회":
      return "GREEN";
    case "연행예술":
    case "종교":
      return "BLUE";
    case "전시창작":
    case "구기체육":
      return "ORANGE";
    case "밴드음악":
    case "생활체육":
      return "PURPLE";
    case "이공학술":
    case "보컬음악":
      return "PINK";
    case "연주음악":
    case "인문학술":
      return "YELLOW";
    default:
      return "GREEN"; // 기본값 임의 지정
  }
};

export {
  getTagColorFromClubType,
  getTagColorFromDivision,
  getTagContentFromClubType,
};
