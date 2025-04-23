import { Injectable } from "@nestjs/common";

import type { ApiDiv001ResponseOk } from "@clubs/interface/api/division/endpoint/apiDiv001";
import type { ApiDiv002ResponseOk } from "@clubs/interface/api/division/endpoint/apiDiv002";

import DivisionRepository from "../repository/division.repository";

@Injectable()
export default class DivisionService {
  constructor(private readonly divisionRepository: DivisionRepository) {}

  async getDivisions(): Promise<ApiDiv001ResponseOk> {
    const divisionsAndPresidents =
      await this.divisionRepository.selectDivisionsAndDivisionPresidents();

    return {
      divisions: divisionsAndPresidents
        .map(e => ({
          id: e.division.id,
          name: e.division.name,
          presidentStudentId: e.division_president_d.studentId,
        }))
        .sort((a, b) => a.id - b.id),
    };
  }

  async getDivisionsCurrent(): Promise<ApiDiv002ResponseOk> {
    const divisions = await this.divisionRepository.fetchAll(new Date());
    return {
      divisions,
    };
  }
}
