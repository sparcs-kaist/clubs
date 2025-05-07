import { Injectable } from "@nestjs/common";

import {
  ApiOvv001RequestQuery,
  ApiOvv001ResponseOK,
} from "@clubs/interface/api/overview/endpoint/apiOvv001";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import { OverviewRepository } from "../repository/overview.repository";

// import ClubStudentTRepository from "../../club/repository-old/club.club-student-t.repository";

@Injectable()
export class OverviewService {
  constructor(private clubDelegateRepository: OverviewRepository) {}

  public async getDelegateOverview(
    query?: ApiOvv001RequestQuery,
  ): Promise<ApiOvv001ResponseOK> {
    const clubsFundamental =
      await this.clubDelegateRepository.findClubsFundamentals(
        query.year,
        query.semesterName,
      );
    const delegates = await this.clubDelegateRepository.findDelegates(
      2024,
      "봄",
    );
    return clubsFundamental
      .filter(
        club =>
          (club.clubNameKr.includes(query.clubNameLike) ||
            club.clubNameEn.includes(query.clubNameLike)) &&
          !query.delegate1 &&
          delegates.findIndex(
            d =>
              d.delegateType === ClubDelegateEnum.Delegate1 &&
              d.clubId === club.clubId,
          ) !== -1 &&
          !query.delegate2 &&
          delegates.findIndex(
            d =>
              d.delegateType === ClubDelegateEnum.Delegate2 &&
              d.clubId === club.clubId,
          ) !== -1,
      )
      .map(club => ({
        district: club.district,
        division: club.division,
        clubNameKr: club.clubNameKr,
        clubNameEn: club.clubNameEn,
        representative: delegates.find(
          d =>
            d.delegateType === ClubDelegateEnum.Representative &&
            d.clubId === club.clubId,
        ),
        delegate1: delegates.find(
          d =>
            d.delegateType === ClubDelegateEnum.Delegate1 &&
            d.clubId === club.clubId,
        ),
        delegate2: delegates.find(
          d =>
            d.delegateType === ClubDelegateEnum.Delegate2 &&
            d.clubId === club.clubId,
        ),
      }));
  }

  public async getClubsOverview(
    _query?: ApiOvv001RequestQuery,
  ): Promise<unknown[]> {
    const clubs = await this.clubDelegateRepository.findClubs(2024, "봄");
    return clubs;
    // return delegates.filter(_d => true);
  }

  // public async getClubsInfoOverview() {
  //   const result = await this.clubOldRepository.getAllClubsGroupedByDivision();

  //   return result.divisions
  //     .map(division => ({
  //       ...division,
  //       clubs: division.clubs,
  //     }))
  //     .flat(1)
  //     .map(cd =>
  //       cd.clubs
  //         .flat(1)
  //         .map(c => ({ ...c, division: { id: cd.id, name: cd.name } })),
  //     );
  // }
}
