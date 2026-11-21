import { ApiClb001ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb001";

type PublicClubDetail =
  ApiClb001ResponseOK["divisions"][number]["clubs"][number];

export type ClubDetail = Omit<PublicClubDetail, "characteristicEn"> & {
  characteristicEn?: PublicClubDetail["characteristicEn"];
};
