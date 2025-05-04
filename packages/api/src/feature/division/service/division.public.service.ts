import { Injectable } from "@nestjs/common";

import { getKSTDate } from "@sparcs-clubs/api/common/util/util";

import { RMDivision } from "../model/division.model";
import { DistrictRepository } from "../repository/district.repository";
import { DivisionRepository } from "../repository/division.repository";
import OldDivisionRepository from "../repository/old.division.repository";

@Injectable()
export default class DivisionPublicService {
  constructor(
    private readonly oldDivisionRepository: OldDivisionRepository,
    private readonly divisionRepository: DivisionRepository,
    private readonly districtRepository: DistrictRepository,
  ) {}

  async findDivisionById(id: number) {
    const result = await this.oldDivisionRepository.findDivisionById(id);
    return result;
  }

  async getDivisionById(param: { id: number }) {
    const result = await this.oldDivisionRepository.selectDivisionById(param);
    return result;
  }

  async getCurrentDivisions() {
    const result = await this.oldDivisionRepository.fetchAll(getKSTDate());
    return result;
  }

  // 위 함수들은 다 old 임. 나중에 수정 필요
  async search(query: { date?: Date }): Promise<Array<RMDivision>> {
    const [divisions, districts] = await Promise.all([
      this.divisionRepository.find(query),
      this.districtRepository.find({}),
    ]);

    const districtMap = new Map(
      districts.map(district => [district.id, district]),
    );

    return divisions.map(division => ({
      ...division,
      district: districtMap.get(division.district.id),
    }));
  }
}
