import { Injectable } from "@nestjs/common";

import { ClubDelegateRepository } from "../../club/repository/club-delegate-repository";

@Injectable()
export class OverviewService {
  constructor(private clubDelegateRepository: ClubDelegateRepository) {}

  public getOverview(): Promise<unknown[]> {
    return this.clubDelegateRepository.find({});
  }
}
