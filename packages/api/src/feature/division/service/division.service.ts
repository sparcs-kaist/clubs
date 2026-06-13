import { Inject, Injectable } from "@nestjs/common";

import type { ApiDiv001ResponseOk } from "@clubs/interface/api/division/endpoint/apiDiv001";
import type { ApiDiv002ResponseOk } from "@clubs/interface/api/division/endpoint/apiDiv002";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";

import OldDivisionRepository from "../repository/old.division.repository";

@Injectable()
export default class DivisionService {
  @Inject(CLOCK) private readonly clock: Clock;

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

  async getDivisionsCurrent(date?: Date): Promise<ApiDiv002ResponseOk> {
    const divisions = await this.oldOldDivisionRepository.fetchAll(
      date ?? this.clock.now(),
    );
    return {
      divisions,
    };
  }
}
