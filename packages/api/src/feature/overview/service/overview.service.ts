import { Injectable } from "@nestjs/common";

import {
  ClubBuildingEnum,
  ClubTypeEnum,
} from "@clubs/domain/club/club-semester";

import {
  ApiOvv001RequestQuery,
  ApiOvv001ResponseOK,
} from "@clubs/interface/api/overview/endpoint/apiOvv001";
import {
  ApiOvv002RequestQuery,
  ApiOvv002ResponseOK,
} from "@clubs/interface/api/overview/endpoint/apiOvv002";
import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import { OverviewRepository } from "@sparcs-clubs/api/feature/overview/repository/overview.repository";

type ClubFundamental = {
  clubId: number;
  division: string;
  district: string;
  clubNameKr: string;
  clubNameEn: string;
  clubStatus: number;
};

type ClubInfo = {
  clubId: number;
  division: string;
  district: string;
  clubNameKr: string;
  clubNameEn: string;
  clubStatus: number;
  description: string;
  advisor: string;
  foundingYear: number;
  totalMemberCnt: number;
};

type Delegates = {
  clubId: number;
  delegateType: number;
  name: string;
  department: string;
  studentNumber: number;
  phoneNumber: string;
  kaistEmail: string;
}[];

// 필터링할 때 필요한 정보
type ClubFilterType = ClubInfo | ClubFundamental;

// 무엇으로 필터링할지에 대한 정보
type FilterQuery = ApiOvv001RequestQuery | ApiOvv002RequestQuery;

@Injectable()
export class OverviewService {
  constructor(private clubDelegateRepository: OverviewRepository) {}

  // 정동아리/가동아리 필터를 만들어줍니다
  // .filter(this.clubTypeOf(query)) 하여 사용
  private clubTypeOf(query: FilterQuery): (club: ClubFilterType) => boolean {
    return (club: ClubFilterType) => {
      if (club.clubStatus === ClubTypeEnum.Regular) {
        return query.regular;
      }
      if (club.clubStatus === ClubTypeEnum.Provisional) {
        return query.provisional;
      }

      return false;
    };
  }

  // 동아리 분과 필터를 만들어줍니다
  private divisionIn(query: FilterQuery): (club: ClubFilterType) => boolean {
    return (club: ClubFilterType) =>
      query.division.split(",").includes(club.division);
  }

  // 대의원1/대의원2 존재 여부 필터를 만들어줍니다
  private hasDelegates(
    query: ApiOvv001RequestQuery,
    delegates: Delegates,
  ): (club: ClubFilterType) => boolean {
    return (club: ClubFilterType) => {
      if (query.hasDelegate1) {
        if (
          delegates.findIndex(
            d =>
              d.delegateType === ClubDelegateEnum.Delegate1 &&
              d.clubId === club.clubId,
          ) === -1
        ) {
          return false;
        }
      }

      if (query.hasDelegate2) {
        if (
          delegates.findIndex(
            d =>
              d.delegateType === ClubDelegateEnum.Delegate2 &&
              d.clubId === club.clubId,
          ) === -1
        ) {
          return false;
        }
      }

      return true;
    };
  }

  public async getDelegateOverview(
    query?: ApiOvv001RequestQuery,
  ): Promise<ApiOvv001ResponseOK> {
    const clubsFundamental =
      await this.clubDelegateRepository.findClubsFundamentals(
        query.year,
        query.semesterName,
      );
    const delegates = await this.clubDelegateRepository.findDelegates(
      query.year,
      query.semesterName,
    );
    return clubsFundamental
      .filter(this.clubTypeOf(query))
      .filter(this.divisionIn(query))
      .filter(this.hasDelegates(query, delegates))
      .map(club => ({
        clubId: club.clubId,
        district: club.district.trim(),
        divisionName: club.division,
        clubTypeEnum: club.clubStatus,
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
    query?: ApiOvv002RequestQuery,
  ): Promise<ApiOvv002ResponseOK> {
    const clubs = await this.clubDelegateRepository.findClubs(
      query.year,
      query.semesterName,
    );
    return clubs
      .filter(this.clubTypeOf(query))
      .filter(this.divisionIn(query))
      .map(club => ({
        clubId: club.clubId,
        divisionName: club.division,
        district: club.district.trim(),
        clubTypeEnum: club.clubStatus,
        clubNameKr: club.clubNameKr,
        clubNameEn: club.clubNameEn,
        fieldsOfActivity: club.characteristicKr,
        foundingYear: club.foundingYear,
        professor: club.advisor,
        totalMemberCnt: club.totalMemberCnt,
        regularMemberCnt: club.regularMemberCnt,
        clubBuildingEnum: club.clubBuildingEnum as ClubBuildingEnum,
        roomLocation: club.roomLocation,
        roomPassword: club.roomPassword?.trim(),
        warning: null,
        caution: null,
      }));
  }
}
