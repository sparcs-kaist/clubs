import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

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

export { getTagColorFromClubType, getTagContentFromClubType };
