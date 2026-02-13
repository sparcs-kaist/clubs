import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { ApiClb004ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb004";

import { takeOne } from "@sparcs-clubs/api/common/util/util";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

@Injectable()
export class ClubGetStudentClubBrief {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentClubBrief(clubId: number): Promise<ApiClb004ResponseOK> {
    const crt = new Date();
    const result = await this.prisma.$queryRaw<
      Array<{ description: string | null; roomPassword: string | null }>
    >(Prisma.sql`
      SELECT c.description, crt.room_password AS roomPassword
      FROM club_t ct
      LEFT JOIN club c ON ct.club_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN club_room_t crt ON ct.club_id = crt.club_id
        AND (
          (crt.end_term IS NULL AND crt.start_term <= ${crt})
          OR (crt.end_term >= ${crt} AND crt.start_term <= ${crt})
        )
      WHERE ct.club_id = ${clubId}
        AND (
          (ct.end_term IS NULL AND ct.start_term <= ${crt})
          OR (ct.end_term >= ${crt} AND ct.start_term <= ${crt})
        )
      LIMIT 1
    `);
    return takeOne(result);
  }
}
