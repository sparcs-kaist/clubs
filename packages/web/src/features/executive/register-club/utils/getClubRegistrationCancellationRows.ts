import { hangulIncludes } from "es-hangul";

import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import type { ApiClb001ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb001";

type Division = ApiClb001ResponseOK["divisions"][number];
type Club = Division["clubs"][number];

export interface ClubRegistrationCancellationRow extends Club {
  divisionName: string;
}

const cancelableClubTypes = [ClubTypeEnum.Regular, ClubTypeEnum.Provisional];

const matchesSearch = (club: Club, searchText: string) => {
  const query = searchText.toLowerCase();

  return (
    club.nameKr.toLowerCase().includes(query) ||
    club.nameEn.toLowerCase().includes(query) ||
    hangulIncludes(club.nameKr, searchText)
  );
};

const getClubRegistrationCancellationRows = (
  divisions: Division[],
  searchText: string,
): ClubRegistrationCancellationRow[] =>
  divisions.flatMap(division =>
    division.clubs
      .filter(
        club =>
          cancelableClubTypes.includes(club.type) &&
          matchesSearch(club, searchText),
      )
      .map(club => ({ ...club, divisionName: division.name })),
  );

export default getClubRegistrationCancellationRows;
