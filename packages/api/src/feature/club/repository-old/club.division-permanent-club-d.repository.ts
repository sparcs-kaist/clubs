import { Inject, Injectable } from "@nestjs/common";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class DivisionPermanentClubDRepository {
  @Inject(CLOCK) private readonly clock: Clock;

  constructor(private readonly prisma: PrismaService) {}

  async findPermenantClub(clubId: number, startTerm?: Date): Promise<boolean> {
    const now = this.clock.now();
    const baseStartTerm = startTerm || now;

    const result = await this.prisma.divisionPermanentClubD.findMany({
      where: {
        clubId,
        startTerm: { lte: baseStartTerm },
        OR: [{ endTerm: { gte: baseStartTerm } }, { endTerm: null }],
      },
      select: { id: true },
    });

    return result.length > 0;
  }
}
