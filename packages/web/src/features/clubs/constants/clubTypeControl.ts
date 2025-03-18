import { ClubTypeEnum } from "@sparcs-clubs/interface/common/enum/club.enum";

import type { TagColor } from "@sparcs-clubs/web/common/components/Tag";

import { ClubDetail } from "../types";

const getTagColorFromClubType = (
  clubType: ClubTypeEnum,
  isPermanent: boolean,
) => {
  let color: TagColor;
  if (isPermanent) {
    color = "GREEN";
  } else if (clubType === ClubTypeEnum.Regular) {
    color = "BLUE";
  } else {
    color = "ORANGE";
  }
  return color;
};

const getClubType = (club: ClubDetail) => {
  let clubType: string;
  if (club.isPermanent) {
    clubType = "상임동아리";
  } else if (club.type === ClubTypeEnum.Regular) {
    clubType = "정동아리";
  } else {
    clubType = "가동아리";
  }
  return clubType;
};

const getShortClubType = (club: ClubDetail) => {
  let clubType: string;
  if (club.isPermanent) {
    clubType = "상임";
  } else if (club.type === ClubTypeEnum.Regular) {
    clubType = "정";
  } else {
    clubType = "가";
  }
  return clubType;
};

export { getClubType, getShortClubType, getTagColorFromClubType };
