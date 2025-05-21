import { Injectable } from "@nestjs/common";

import type { ApiDiv001ResponseOk } from "@clubs/interface/api/division/endpoint/apiDiv001";
import type { ApiDiv002ResponseOk } from "@clubs/interface/api/division/endpoint/apiDiv002";

import OldDivisionRepository from "../repository/old.division.repository";

@Injectable()
export default class DivisionService {
  constructor(
    private readonly oldOldDivisionRepository: OldDivisionRepository,
  ) {}

  async getDivisions(): Promise<ApiDiv001ResponseOk> {
    const divisionsAndPresidents =
      await this.oldOldDivisionRepository.selectDivisionsAndDivisionPresidents();

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
    const divisions = await this.oldOldDivisionRepository.fetchAll(new Date());
    return {
      divisions,
    };
  }
}
